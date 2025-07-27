mosAIc v1

[] Add metadata to layouts and pages 
    -use generate metadata for [workflowId] 
    -if client component, create a new file with the component and import import it 
[] Active links - nav bar links background different for the active link - do we even need this?
[] Add a dashboard
[] Navigate programatically to dashboard after LogIn
    -use router and on handleClick to navigate programatically (click on login, end up on dashboard)
[] Redirect wrong links to proper websites rather than 404 
[] Add loading UI/spinner while routing after login - loading.tsx
[] Handle backend errors on the UI - error.tsx 
[] Frontend: Clerk Setup
    []Set up Clerk project and enable Google OAuth in Clerk dashboard.
    []Add Clerk Provider and <SignInWithOAuthButton /> to your app.
    []Configure your frontend to handle Clerk auth state (e.g. with useUser).
[] Backend: Save to Supabase
    []After Clerk creates the user, listen for user creation (e.g. via webhook or in the frontend after successful login).
    []Extract user ID, email, and name from Clerk.
    []Send this info to your FastAPI backend (e.g. /api/save-user).
    []Verify the request is authenticated (JWT from Clerk).
    []Check if the user already exists in Supabase. If not, create a new record in Supabase (e.g. insert into users table).
[] After sign-in and backend save, redirect to /dashboard.
[] Frontend: Clerk Session Check
    []When a user clicks "Log in", show the Clerk Sign In modal or redirect to /sign-in.
    []If user is authenticated, automatically redirect to /dashboard.
[] Routing Protection
    []Use middleware or route guards (App Router or Clerk components) to:
    [] Block access to /dashboard if not logged in.
    [] Redirect from /login or / to /dashboard if already logged in.


 Clerk–Supabase Integration Considerations
 In Supabase, structure your users table to include:

Clerk user ID
Email
Name (optional)
Any additional metadata

 You can optionally use Clerk webhooks (user.created, user.deleted) to sync Supabase automatically.
 Secure your FastAPI endpoint to only accept requests from logged-in Clerk users (validate JWTs using Clerk SDK or manually).




async await for sever components, use hook for client components when you want to have query params (lan=en)
