# Execution Scripts

Deterministic Python scripts for reliable operations. This layer handles:
- API calls (Supabase, external services)
- Data processing and transformations
- File operations
- Database interactions

## Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Unix/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Python Version

This project requires Python 3.8 or higher. Recommended: Python 3.11+

Check your version:
```bash
python --version
```

## Conventions

- **Well-commented code**: Explain complex logic, API quirks, and business rules
- **Error handling**: Use try/except with clear error messages
- **Inputs**: Accept via CLI arguments (`sys.argv`) or environment variables
- **Outputs**: Print to stdout or write to `.tmp/` directory
- **Path handling**: Use `pathlib.Path` for cross-platform compatibility (especially on Windows)

## Creating Scripts

Example structure:
```python
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure .tmp/ directory exists
os.makedirs('.tmp', exist_ok=True)

# Load environment variables
load_dotenv()

def main():
    # Your logic here
    pass

if __name__ == "__main__":
    main()
```

## Windows Considerations

- Use `pathlib.Path` instead of string concatenation for paths
- Activate venv with `.venv\Scripts\activate` (not `source`)
- Environment variables work the same as Unix

## Troubleshooting

**Virtual environment not activating?**
- Ensure you're in the project root directory
- Check Python is installed: `python --version`
- Try `python -m venv .venv` again

**Module not found errors?**
- Activate virtual environment first
- Run `pip install -r requirements.txt`
- Check `pip list` to verify installations

**Import errors with Supabase?**
- Ensure `.env` file has `SUPABASE_URL` and `SUPABASE_KEY`
- Check environment variables are loading: `print(os.getenv('SUPABASE_URL'))`
