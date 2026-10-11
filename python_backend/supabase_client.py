
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
)

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing from the .env file")

if not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY "
        "is missing from the .env file"
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
