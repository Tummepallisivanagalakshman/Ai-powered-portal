import os
from dotenv import load_dotenv

# Load variables from the root .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

class Settings:
    # Supabase HTTP configuration (for standard client if still needed)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY)
    
    # SQLAlchemy / Postgres configuration
    # The user should provide this in the .env file. Fallback is a local SQLite for testing if missing.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    
    # JWT Auth Configuration
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret-default-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AI Integrations
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

settings = Settings()
