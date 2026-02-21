"""
Chatbot agent service using LangGraph and Gemini
Casual, friendly assistant for menu management
"""
import logging
from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from api.core.config import GEMINI_API_KEY
from api.core.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# Initialize Gemini model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=GEMINI_API_KEY,
    temperature=0.7,
)

# System prompt - casual and friendly, in Croatian
SYSTEM_PROMPT = """Ti si prijateljski, opušten asistent koji pomaže s upravljanjem jelovnika restorana.
Budi koristan ali ne previše formalan - budi opušten i prijateljski.
Budi kratak i jasan. Ne budi previše opširan.
Možeš ažurirati cijene jela kada te pitaju.
Ako trebaš pronaći jelo, možeš pretraživati po imenu.
Budi prijateljski i koristi emojije povremeno, ali ne previše.
Odgovaraj UVJEK na hrvatskom jeziku.

VAŽNA PRAVILA:
1. Ne traži od korisnika restaurant_id - već znaš koji je restoran u pitanju iz konteksta.
2. KADA GOD trebaš ažurirati cijenu jela, MORAS pozvati alat update_menu_item_price. NIKADA ne kaži da si ažurirao cijenu ako nisi pozvao alat!
3. KADA GOD trebaš sakriti ili prikazati jelo na jelovniku (Dostupno/Nedostupno), MORAS pozvati alat toggle_menu_item_availability. Korisnik može reći "sakrij rižoto", "rižoto nedostupno", "rižoto dostupno", "prikaži rižoto" itd.
4. Ako korisnik kaže samo cijenu (npr. "40 eur"), a u prethodnoj poruci ste razgovarali o određenom jelu, koristi kontekst iz prethodnih poruka da znaš o kojoj stavci se radi.
5. Ako nisi siguran o kojoj stavci se radi, koristi alat list_menu_items da vidiš dostupne stavke.
7. Koristi TOČNO ime jela kako je u bazi - ako je "Lava cake", ne piši "Lav cake"."""

# Internal function that requires restaurant_id
def _update_menu_item_price_internal(item_name: str, new_price: float, restaurant_id: str) -> str:
    """
    Update the price of a menu item by its name.
    
    Args:
        item_name: The name of the menu item (in Croatian or any language)
        new_price: The new price as a float (e.g., 15.50 for 15.50 euros)
        restaurant_id: The restaurant ID to ensure we only update items from this restaurant
    
    Returns:
        Success message with item name and new price, or error message
    """
    logger.info(f"[_update_menu_item_price_internal] Called with item_name='{item_name}', new_price={new_price}, restaurant_id={restaurant_id}")
    try:
        supabase = get_supabase_client()
        
        # Find the menu item by name (search in name_hr)
        # Try exact match first, then case-insensitive
        logger.debug(f"[_update_menu_item_price_internal] Searching for item '{item_name}' in restaurant {restaurant_id}")
        result = supabase.table('menu_items').select('id, name_hr, price').eq('restaurant_id', restaurant_id).ilike('name_hr', f'%{item_name}%').execute()
        
        if not result.data:
            logger.warning(f"[_update_menu_item_price_internal] No items found matching '{item_name}' for restaurant {restaurant_id}")
            return f"Nisam pronašao '{item_name}' u tvom jelovniku. Provjeri ime i pokušaj ponovno!"
        
        if len(result.data) > 1:
            items_list = ', '.join([item['name_hr'] for item in result.data[:5]])
            logger.warning(f"[_update_menu_item_price_internal] Multiple items found ({len(result.data)}) matching '{item_name}': {items_list}")
            return f"Pronašao sam više jela koja odgovaraju '{item_name}': {items_list}. Budi precizniji!"
        
        item = result.data[0]
        item_id = item['id']
        old_price = float(item['price'])
        logger.info(f"[_update_menu_item_price_internal] Found item: id={item_id}, name={item['name_hr']}, old_price={old_price}")
        
        # Validate price
        if new_price <= 0:
            logger.warning(f"[_update_menu_item_price_internal] Invalid price: {new_price} (must be > 0)")
            return "Cijena mora biti veća od 0!"
        
        if new_price > 10000:
            logger.warning(f"[_update_menu_item_price_internal] Suspiciously high price: {new_price}")
            return "Ta cijena izgleda previsoka. Provjeri iznos!"
        
        # Update the price
        logger.debug(f"[_update_menu_item_price_internal] Updating item {item_id} from {old_price} to {new_price}")
        update_result = supabase.table('menu_items').update({'price': new_price}).eq('id', item_id).execute()
        
        if update_result.data:
            logger.info(f"[_update_menu_item_price_internal] Successfully updated {item['name_hr']} (id={item_id}) from €{old_price:.2f} to €{new_price:.2f}")
            return f"✅ Ažurirao sam {item['name_hr']} s €{old_price:.2f} na €{new_price:.2f}"
        else:
            logger.error(f"[_update_menu_item_price_internal] Update returned no data for item {item_id}")
            return f"Nešto je pošlo po zlu pri ažuriranju cijene. Pokušaj ponovno!"
            
    except Exception as e:
        logger.error(f"[_update_menu_item_price_internal] Error updating menu item price: {str(e)}", exc_info=True)
        return f"Ups, nešto je pošlo po zlu: {str(e)}"

# Tool wrapper that LLM sees (without restaurant_id)
@tool
def update_menu_item_price(item_name: str, new_price: float) -> str:
    """
    Update the price of a menu item by its name.
    The restaurant context is automatically known - you don't need to ask for it.
    
    Args:
        item_name: The name of the menu item (in Croatian or any language)
        new_price: The new price as a float (e.g., 15.50 for 15.50 euros)
    
    Returns:
        Success message with item name and new price, or error message
    """
    # This will be called by tool_node with restaurant_id injected
    # For now, return error - should not be called directly
    return "Error: restaurant_id not provided"

# Internal function that requires restaurant_id
def _list_menu_items_internal(restaurant_id: str, limit: int = 10) -> str:
    """
    List menu items to help find items by name.
    
    Args:
        restaurant_id: The restaurant ID
        limit: Maximum number of items to return (default 10)
    
    Returns:
        Formatted string with item names and prices
    """
    logger.info(f"[_list_menu_items_internal] Called with restaurant_id={restaurant_id}, limit={limit}")
    try:
        supabase = get_supabase_client()
        logger.debug(f"[_list_menu_items_internal] Fetching menu items for restaurant {restaurant_id}")
        result = supabase.table('menu_items').select('name_hr, price').eq('restaurant_id', restaurant_id).limit(limit).execute()
        
        if not result.data:
            logger.info(f"[_list_menu_items_internal] No menu items found for restaurant {restaurant_id}")
            return "Nema stavki u jelovniku."
        
        logger.info(f"[_list_menu_items_internal] Found {len(result.data)} menu items for restaurant {restaurant_id}")
        items_text = "\n".join([f"- {item['name_hr']}: €{float(item['price']):.2f}" for item in result.data])
        return f"Evo nekih stavki iz tvog jelovnika:\n{items_text}"
        
    except Exception as e:
        logger.error(f"[_list_menu_items_internal] Error listing menu items: {str(e)}", exc_info=True)
        return f"Nisam mogao dohvatiti stavke jelovnika: {str(e)}"

# Tool wrapper that LLM sees (without restaurant_id)
@tool
def list_menu_items(limit: int = 10) -> str:
    """
    List menu items to help find items by name.
    The restaurant context is automatically known - you don't need to ask for it.
    
    Args:
        limit: Maximum number of items to return (default 10)
    
    Returns:
        Formatted string with item names and prices
    """
    # This will be called by tool_node with restaurant_id injected
    # For now, return error - should not be called directly
    return "Error: restaurant_id not provided"

# Internal function that requires restaurant_id
def _toggle_menu_item_availability_internal(item_name: str, is_available: bool, restaurant_id: str) -> str:
    """
    Toggle menu item availability (show/hide from menu).
    
    Args:
        item_name: The name of the menu item (in Croatian or any language)
        is_available: True to make item available (show on menu), False to hide it
        restaurant_id: The restaurant ID to ensure we only update items from this restaurant
    
    Returns:
        Success message with item name and new availability status, or error message
    """
    logger.info(f"[_toggle_menu_item_availability_internal] Called with item_name='{item_name}', is_available={is_available}, restaurant_id={restaurant_id}")
    try:
        supabase = get_supabase_client()
        
        # Find the menu item by name (search in name_hr)
        logger.debug(f"[_toggle_menu_item_availability_internal] Searching for item '{item_name}' in restaurant {restaurant_id}")
        result = supabase.table('menu_items').select('id, name_hr, is_available').eq('restaurant_id', restaurant_id).ilike('name_hr', f'%{item_name}%').execute()
        
        if not result.data:
            logger.warning(f"[_toggle_menu_item_availability_internal] No items found matching '{item_name}' for restaurant {restaurant_id}")
            return f"Nisam pronašao '{item_name}' u tvom jelovniku. Provjeri ime i pokušaj ponovno!"
        
        if len(result.data) > 1:
            items_list = ', '.join([item['name_hr'] for item in result.data[:5]])
            logger.warning(f"[_toggle_menu_item_availability_internal] Multiple items found ({len(result.data)}) matching '{item_name}': {items_list}")
            return f"Pronašao sam više jela koja odgovaraju '{item_name}': {items_list}. Budi precizniji!"
        
        item = result.data[0]
        item_id = item['id']
        old_status = bool(item['is_available'])
        logger.info(f"[_toggle_menu_item_availability_internal] Found item: id={item_id}, name={item['name_hr']}, current is_available={old_status}")
        
        # Update the availability
        logger.debug(f"[_toggle_menu_item_availability_internal] Updating item {item_id} availability from {old_status} to {is_available}")
        update_result = supabase.table('menu_items').update({'is_available': is_available}).eq('id', item_id).execute()
        
        if update_result.data:
            status_text = "dostupno" if is_available else "nedostupno"
            logger.info(f"[_toggle_menu_item_availability_internal] Successfully updated {item['name_hr']} (id={item_id}) availability to {is_available}")
            return f"✅ Postavio sam {item['name_hr']} kao {status_text} na jelovniku."
        else:
            logger.error(f"[_toggle_menu_item_availability_internal] Update returned no data for item {item_id}")
            return f"Nešto je pošlo po zlu pri ažuriranju dostupnosti. Pokušaj ponovno!"
            
    except Exception as e:
        logger.error(f"[_toggle_menu_item_availability_internal] Error toggling menu item availability: {str(e)}", exc_info=True)
        return f"Ups, nešto je pošlo po zlu: {str(e)}"

# Tool wrapper that LLM sees (without restaurant_id)
@tool
def toggle_menu_item_availability(item_name: str, is_available: bool) -> str:
    """
    Show or hide a menu item from the menu (make it available or unavailable).
    The restaurant context is automatically known - you don't need to ask for it.
    
    Args:
        item_name: The name of the menu item (in Croatian or any language)
        is_available: True to show the item on menu (make it available), False to hide it (make it unavailable)
    
    Returns:
        Success message with item name and new availability status, or error message
    """
    # This will be called by tool_node with restaurant_id injected
    # For now, return error - should not be called directly
    return "Error: restaurant_id not provided"

# Bind tools to LLM (only the wrappers without restaurant_id)
llm_with_tools = llm.bind_tools([update_menu_item_price, list_menu_items, toggle_menu_item_availability])

# Log available tools
logger.info(f"[chatbot_agent] Initialized with {len([update_menu_item_price, list_menu_items, toggle_menu_item_availability])} tools:")
logger.info(f"[chatbot_agent] - update_menu_item_price: Updates menu item prices")
logger.info(f"[chatbot_agent] - list_menu_items: Lists menu items from restaurant")
logger.info(f"[chatbot_agent] - toggle_menu_item_availability: Show/hide menu items (Dostupno/Nedostupno)")

def create_agent_graph():
    """Create the LangGraph agent graph"""
    logger.info("[create_agent_graph] Creating new LangGraph agent graph")
    from typing import Annotated
    from langgraph.graph.message import add_messages
    
    # Define state type
    from typing_extensions import TypedDict
    
    class AgentState(TypedDict):
        messages: Annotated[list, add_messages]
        restaurant_id: str
    
    def agent_node(state: AgentState):
        """Agent node that processes messages and decides on actions"""
        messages = state.get("messages", [])
        restaurant_id = state.get("restaurant_id", "unknown")
        
        logger.info(f"[agent_node] Processing message for restaurant {restaurant_id}, message count: {len(messages)}")
        
        # Add system message if not present
        if not messages or not isinstance(messages[0], SystemMessage):
            messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
            logger.debug("[agent_node] Added system message to conversation")
        
        # Get response from LLM
        logger.debug(f"[agent_node] Invoking LLM with {len(messages)} messages")
        response = llm_with_tools.invoke(messages)
        
        # Log if tool calls are present
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_names = [tc.get("name") or (tc.get("function", {}) or {}).get("name", "unknown") for tc in response.tool_calls]
            logger.info(f"[CHATBOT] 🤖 LLM decided to call tools: {tool_names}")
        else:
            response_preview = response.content[:150] if hasattr(response, 'content') and response.content else 'empty'
            logger.info(f"[CHATBOT] 💬 LLM response (no tools): \"{response_preview}{'...' if len(str(response.content)) > 150 else ''}\"")
        
        return {"messages": [response]}
    
    def tool_node(state: AgentState):
        """Tool execution node"""
        messages = state.get("messages", [])
        last_message = messages[-1]
        restaurant_id = state.get("restaurant_id", "")
        
        logger.info(f"[tool_node] Executing tools for restaurant {restaurant_id}")
        
        # Execute tool calls
        tool_results = []
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            logger.info(f"[tool_node] Found {len(last_message.tool_calls)} tool call(s) to execute")
            for idx, tool_call in enumerate(last_message.tool_calls):
                tool_name = tool_call.get("name") or tool_call.get("function", {}).get("name", "")
                tool_args = tool_call.get("args") or tool_call.get("function", {}).get("arguments", {})
                
                logger.debug(f"[tool_node] Tool call {idx+1}: {tool_name} with args: {tool_args}")
                
                # Parse args if it's a string
                if isinstance(tool_args, str):
                    import json
                    try:
                        tool_args = json.loads(tool_args)
                        logger.debug(f"[tool_node] Parsed tool args from JSON string")
                    except Exception as e:
                        logger.warning(f"[tool_node] Failed to parse tool args JSON: {e}")
                        tool_args = {}
                
                # Add restaurant_id if not present
                if restaurant_id and "restaurant_id" not in tool_args:
                    tool_args["restaurant_id"] = restaurant_id
                    logger.debug(f"[tool_node] Added restaurant_id to tool args")
                
                # Execute the tool (using internal functions with restaurant_id)
                logger.info(f"[CHATBOT] 🔧 Executing tool: {tool_name}")
                logger.info(f"[CHATBOT]   📋 Tool arguments: {tool_args}")
                start_time = __import__('time').time()
                try:
                    if tool_name == "update_menu_item_price":
                        # Call internal function with restaurant_id
                        item_name = tool_args.get("item_name", "")
                        new_price = tool_args.get("new_price", 0.0)
                        logger.info(f"[CHATBOT]   💰 Updating price for '{item_name}' to €{new_price:.2f}")
                        result = _update_menu_item_price_internal(
                            item_name=item_name,
                            new_price=new_price,
                            restaurant_id=restaurant_id
                        )
                        logger.info(f"[CHATBOT]   ✅ Tool result: {result}")
                    elif tool_name == "list_menu_items":
                        # Call internal function with restaurant_id
                        limit = tool_args.get("limit", 10)
                        logger.info(f"[CHATBOT]   📋 Listing menu items (limit: {limit})")
                        result = _list_menu_items_internal(
                            restaurant_id=restaurant_id,
                            limit=limit
                        )
                        logger.info(f"[CHATBOT]   ✅ Tool result: {result[:200]}..." if len(str(result)) > 200 else f"[CHATBOT]   ✅ Tool result: {result}")
                    elif tool_name == "toggle_menu_item_availability":
                        # Call internal function with restaurant_id
                        item_name = tool_args.get("item_name", "")
                        is_available = tool_args.get("is_available", True)
                        status_text = "dostupno" if is_available else "nedostupno"
                        logger.info(f"[CHATBOT]   👁️  Setting '{item_name}' to {status_text}")
                        result = _toggle_menu_item_availability_internal(
                            item_name=item_name,
                            is_available=is_available,
                            restaurant_id=restaurant_id
                        )
                        logger.info(f"[CHATBOT]   ✅ Tool result: {result}")
                    else:
                        logger.warning(f"[CHATBOT]   ❌ Unknown tool requested: {tool_name}")
                        result = f"Unknown tool: {tool_name}"
                    
                    elapsed = __import__('time').time() - start_time
                    logger.info(f"[CHATBOT]   ⏱️  Tool {tool_name} completed in {elapsed:.2f}s")
                except Exception as e:
                    logger.error(f"[CHATBOT]   ❌ Error executing tool {tool_name}: {str(e)}", exc_info=True)
                    result = f"Error executing {tool_name}: {str(e)}"
                
                tool_call_id = tool_call.get("id") or tool_call.get("function", {}).get("name", "")
                tool_results.append({
                    "tool_call_id": tool_call_id,
                    "content": result
                })
        else:
            logger.warning(f"[tool_node] No tool calls found in last message")
        
        # Return tool results as messages
        from langchain_core.messages import ToolMessage
        tool_messages = [
            ToolMessage(content=result["content"], tool_call_id=result["tool_call_id"]) 
            for result in tool_results
        ]
        
        logger.info(f"[tool_node] Returning {len(tool_messages)} tool result message(s)")
        return {"messages": tool_messages}
    
    def should_continue(state: AgentState) -> str:
        """Determine if we should continue (call tools) or end"""
        messages = state.get("messages", [])
        if not messages:
            logger.debug("[should_continue] No messages, ending")
            return "end"
        
        last_message = messages[-1]
        
        # Check for tool calls
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            logger.debug(f"[should_continue] Tool calls detected, routing to tools")
            return "tools"
        if hasattr(last_message, 'tool_calls') and getattr(last_message, 'tool_calls', None):
            logger.debug(f"[should_continue] Tool calls detected (alternative check), routing to tools")
            return "tools"
        
        logger.debug("[should_continue] No tool calls, ending conversation")
        return "end"
    
    # Build the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    
    # After tools, go back to agent
    workflow.add_edge("tools", "agent")
    
    compiled = workflow.compile()
    logger.info("[create_agent_graph] Agent graph created successfully")
    return compiled

# Global agent instance (can be reused)
_agent = None

def get_agent():
    """Get or create the agent instance"""
    global _agent
    if _agent is None:
        logger.info("[get_agent] Creating new agent graph instance")
        _agent = create_agent_graph()
    else:
        logger.debug("[get_agent] Returning existing agent graph instance")
    return _agent

async def process_chat_message(
    message: str,
    restaurant_slug: str,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Process a chat message and return the agent's response.
    
    Args:
        message: User's message
        restaurant_slug: Restaurant slug to identify the restaurant
        conversation_history: Optional list of previous messages in format [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        Dict with response, tool_calls, and updated conversation history
    """
    logger.info(f"[CHATBOT] 📨 User message received for restaurant slug '{restaurant_slug}'")
    logger.info(f"[CHATBOT] 💬 User said: \"{message}\"")
    try:
        # Get restaurant by slug
        logger.debug(f"[process_chat_message] Looking up restaurant by slug: {restaurant_slug}")
        supabase = get_supabase_client()
        restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
        
        if not restaurant_result.data:
            logger.warning(f"[CHATBOT] ❌ No restaurant found for slug: {restaurant_slug}")
            return {
                "response": f"Restoran s slug-om '{restaurant_slug}' nije pronađen. Provjeri slug i pokušaj ponovno!",
                "tool_calls": [],
                "conversation_history": []
            }
        
        restaurant = restaurant_result.data[0]
        restaurant_id = restaurant['id']
        logger.info(f"[CHATBOT] 🏪 Restaurant: {restaurant['name']} (id: {restaurant_id}, slug: {restaurant_slug})")

        # Build message history
        messages = []

        # Build system prompt with optional custom instructions
        system_prompt = SYSTEM_PROMPT
        custom_prompt = restaurant.get('chatbot_system_prompt', '').strip()
        if custom_prompt:
            system_prompt += f"\n\nDODATNE UPUTE OD VLASNIKA RESTORANA:\n{custom_prompt}"
            logger.info(f"[CHATBOT] 📝 Using custom system prompt ({len(custom_prompt)} chars)")

        # Add system context
        messages.append(SystemMessage(content=system_prompt))
        
        # Add conversation history if provided
        history_count = len(conversation_history) if conversation_history else 0
        if conversation_history:
            logger.info(f"[CHATBOT] 📜 Conversation history: {history_count} messages, using last {min(5, history_count)}")
            for msg in conversation_history[-5:]:  # Keep last 5 messages for context
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                    logger.debug(f"[CHATBOT]   📨 History - User: \"{msg['content']}\"")
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
                    logger.debug(f"[CHATBOT]   🤖 History - Assistant: \"{msg['content'][:100]}...\"")
        else:
            logger.info(f"[CHATBOT] 📜 No conversation history - starting new conversation")
        
        # Add current user message
        messages.append(HumanMessage(content=message))
        logger.debug(f"[process_chat_message] Built message list with {len(messages)} messages (including system)")
        
        # Run the agent
        logger.info(f"[CHATBOT] 🤖 Invoking agent for restaurant {restaurant_id}")
        agent = get_agent()
        result = agent.invoke({
            "messages": messages,
            "restaurant_id": restaurant_id
        })
        
        logger.debug(f"[process_chat_message] Agent returned {len(result.get('messages', []))} messages")
        
        # Extract the final response
        final_messages = result.get("messages", [])
        assistant_message = None
        tool_calls = []
        
        # Debug: Log all message types
        logger.debug(f"[CHATBOT] Final messages count: {len(final_messages)}")
        for idx, msg in enumerate(final_messages):
            msg_type = type(msg).__name__
            has_content = hasattr(msg, 'content') and bool(msg.content)
            has_tool_calls = hasattr(msg, 'tool_calls') and bool(msg.tool_calls)
            logger.debug(f"[CHATBOT]   Message {idx}: {msg_type}, has_content: {has_content}, has_tool_calls: {has_tool_calls}")
        
        # Check ALL messages for tool calls (tools are called before final response)
        from langchain_core.messages import ToolMessage
        tools_were_called = False
        for msg in final_messages:
            if isinstance(msg, AIMessage):
                # Check for tool calls in any assistant message
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    tool_calls = [
                        {
                            "name": tc.get("name") or (tc.get("function", {}) or {}).get("name", ""),
                            "args": tc.get("args") or (tc.get("function", {}) or {}).get("arguments", {})
                        } 
                        for tc in msg.tool_calls
                    ]
                    logger.info(f"[CHATBOT] 🔧 Agent requested {len(tool_calls)} tool call(s)")
                    for idx, tc in enumerate(tool_calls, 1):
                        logger.info(f"[CHATBOT]   Tool {idx}: {tc['name']} with args: {tc['args']}")
                    tools_were_called = True
            elif isinstance(msg, ToolMessage):
                # If we see ToolMessage, tools were definitely executed
                tools_were_called = True
                logger.debug(f"[CHATBOT] Detected ToolMessage - tools were executed")
        
        # Find the last assistant message with content (this is the final response)
        # The agent should generate a response after tools are executed, so we prefer the agent's response
        assistant_message = None
        for msg in reversed(final_messages):
            if isinstance(msg, AIMessage):
                # Use this message if it has content (prefer the final response after tool execution)
                if msg.content:
                    assistant_message = msg
                    logger.info(f"[CHATBOT] Using agent's final response: {msg.content[:100]}...")
                    break
        
        # Fallback to tool result only if no agent response is available
        tool_result_message = None
        if not assistant_message or not assistant_message.content:
            logger.warning("[CHATBOT] No agent response found, looking for tool result as fallback")
            for msg in reversed(final_messages):
                if isinstance(msg, ToolMessage):
                    tool_result_message = msg
                    logger.info(f"[CHATBOT] Using tool result as fallback response: {msg.content[:100]}...")
                    break
        
        # Prefer agent's response (which incorporates tool results), fallback to tool result if needed
        if assistant_message and assistant_message.content:
            response_text = assistant_message.content
        elif tool_result_message:
            response_text = tool_result_message.content
        else:
            # Last resort fallback
            logger.warning("[process_chat_message] No assistant message or tool result found, using default")
            response_text = "Gotovo!"
        
        # Fallback detection: If response mentions updates/changes, tools were likely called
        # This helps catch cases where ToolMessage detection might have failed
        response_lower = response_text.lower()
        if not tools_were_called:
            # Check for indicators that tools were used
            update_indicators = [
                "ažurirao", "ažurirala", "ažurirali", "ažurirale",
                "promijenio", "promijenila", "promijenili", "promijenile",
                "postavio", "postavila", "postavili", "postavile",
                "sakrio", "sakrila", "sakrili", "sakrile",
                "prikazao", "prikazala", "prikazali", "prikazale",
                "dostupno", "nedostupno"
            ]
            if any(indicator in response_lower for indicator in update_indicators):
                # Also check if it's about menu items (cijena, jelo, stavka, etc.)
                menu_indicators = ["cijen", "jelo", "stavk", "jelovnik", "menu"]
                if any(indicator in response_lower for indicator in menu_indicators):
                    tools_were_called = True
                    logger.info(f"[CHATBOT] 🔍 Detected tool usage from response content: \"{response_text[:100]}...\"")
        
        # Warn if agent claims to have updated price but didn't call the tool
        if "ažurirao" in response_lower or "promijenio" in response_lower:
            if "cijen" in response_lower and not tools_were_called:
                logger.warning(f"[CHATBOT] ⚠️  WARNING: Agent claims to have updated price but NO tool was called!")
                logger.warning(f"[CHATBOT]   Response: \"{response_text}\"")
        
        logger.info(f"[CHATBOT] 💬 Sending response to user: \"{response_text}\"")
        logger.info(f"[CHATBOT] ✅ Conversation complete - response length: {len(response_text)} chars, tool_calls: {len(tool_calls)}, tools_were_called: {tools_were_called}")
        
        # If tools were called but tool_calls array is empty, populate it from detected execution
        if tools_were_called and len(tool_calls) == 0:
            # Mark that tools were executed (frontend can use this to trigger refresh)
            tool_calls = [{"name": "executed", "args": {}}]
            logger.info(f"[CHATBOT] 📢 Tools were executed - marking for broadcast")
        
        # Build updated conversation history
        updated_history = (conversation_history or []) + [
            {"role": "user", "content": message},
            {"role": "assistant", "content": response_text}
        ]
        
        return {
            "response": response_text,
            "tool_calls": tool_calls,
            "tools_were_called": tools_were_called,
            "conversation_history": updated_history[-10:]  # Keep last 10 messages
        }
        
    except Exception as e:
        logger.error(f"[process_chat_message] Error processing chat message: {str(e)}", exc_info=True)
        return {
            "response": f"Ups, nešto je pošlo po zlu! 😅 Pokušaj ponovno za trenutak.",
            "tool_calls": [],
            "tools_were_called": False,
            "conversation_history": conversation_history or []
        }

