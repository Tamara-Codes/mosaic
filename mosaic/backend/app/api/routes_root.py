from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check():
    return {"message": "mosAIc API is running", "status": "healthy"}
