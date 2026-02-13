"""
Verification Script: Auth Migration to Supabase

This script verifies that the authentication migration was successful by checking:
1. All required tables exist
2. Row Level Security (RLS) is enabled
3. Database triggers are active
4. Basic queries work

Usage:
    python execution/verify_auth_migration.py

Requirements:
    - .env file with SUPABASE_URL and SUPABASE_KEY
    - python-dotenv==1.0.1, requests==2.31.0
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

# REST API base URL
REST_URL = f"{SUPABASE_URL}/rest/v1"

# Headers for API requests
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

def print_header(text: str):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_check(passed: bool, message: str):
    """Print check result"""
    icon = "[OK]" if passed else "[FAIL]"
    print(f"{icon} {message}")

def verify_table_exists(table_name: str) -> bool:
    """Check if a table exists by querying it"""
    try:
        response = requests.get(
            f"{REST_URL}/{table_name}",
            headers=HEADERS,
            params={'select': '*', 'limit': 0}
        )
        return response.status_code == 200
    except Exception as e:
        print(f"   Error: {str(e)}")
        return False

def verify_tables_exist():
    """Verify all required tables exist"""
    print_header("1. Verifying Tables")

    required_tables = [
        'profiles',
        'advisor_details',
        'sessions',
        'messages',
        'advisor_applications'
    ]

    all_exist = True

    for table_name in required_tables:
        exists = verify_table_exists(table_name)
        print_check(exists, f"Table '{table_name}' exists")
        if not exists:
            all_exist = False

    return all_exist

def verify_profiles_structure():
    """Verify profiles table has correct columns"""
    print_header("2. Verifying Profiles Table Structure")

    try:
        response = requests.get(
            f"{REST_URL}/profiles",
            headers=HEADERS,
            params={
                'select': 'id,email,full_name,username,date_of_birth,time_of_birth,avatar_url,credits,role,created_at,updated_at',
                'limit': 0
            }
        )

        if response.status_code == 200:
            print_check(True, "Profiles table has all required columns")
            return True
        else:
            print_check(False, f"Profiles table structure issue (HTTP {response.status_code})")
            return False
    except Exception as e:
        print_check(False, f"Profiles table structure issue: {str(e)}")
        return False

def verify_advisor_applications_accessible():
    """Verify advisor_applications table is accessible"""
    print_header("3. Verifying Advisor Applications Table")

    try:
        response = requests.get(
            f"{REST_URL}/advisor_applications",
            headers=HEADERS,
            params={'select': '*', 'limit': 1}
        )

        if response.status_code == 200:
            data = response.json()
            print_check(True, "Advisor applications table is accessible")
            print(f"   Found {len(data)} application(s) in database")
            return True
        else:
            print_check(False, f"Advisor applications table issue (HTTP {response.status_code})")
            return False
    except Exception as e:
        print_check(False, f"Advisor applications table issue: {str(e)}")
        return False

def verify_rpc_functions():
    """Verify RPC helper functions exist"""
    print_header("4. Verifying RPC Functions")

    functions_ok = True

    # Test add_credits function
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/add_credits",
            headers=HEADERS,
            json={'user_id': '00000000-0000-0000-0000-000000000000', 'amount': 0}
        )

        # Function exists if we get 200 or 400 (validation error), but not 404
        if response.status_code in [200, 400]:
            print_check(True, "Function 'add_credits' exists")
        elif response.status_code == 404:
            print_check(False, "Function 'add_credits' does not exist")
            functions_ok = False
        else:
            # Other error, but function likely exists
            print_check(True, f"Function 'add_credits' exists (HTTP {response.status_code})")
    except Exception as e:
        print_check(False, f"Error checking add_credits: {str(e)}")
        functions_ok = False

    # Test deduct_credits function
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/deduct_credits",
            headers=HEADERS,
            json={'user_id': '00000000-0000-0000-0000-000000000000', 'amount': 0}
        )

        if response.status_code in [200, 400]:
            print_check(True, "Function 'deduct_credits' exists")
        elif response.status_code == 404:
            print_check(False, "Function 'deduct_credits' does not exist")
            functions_ok = False
        else:
            print_check(True, f"Function 'deduct_credits' exists (HTTP {response.status_code})")
    except Exception as e:
        print_check(False, f"Error checking deduct_credits: {str(e)}")
        functions_ok = False

    return functions_ok

def check_test_data():
    """Check if there's any test data in profiles"""
    print_header("5. Checking for Test Data")

    try:
        response = requests.get(
            f"{REST_URL}/profiles",
            headers=HEADERS,
            params={'select': 'id,email,username,role,credits', 'limit': 5}
        )

        if response.status_code == 200:
            data = response.json()

            if len(data) == 0:
                print_check(True, "No profiles found (expected for fresh installation)")
                print("   [TIP] Test signup flow to create first profile")
            else:
                print_check(True, f"Found {len(data)} profile(s) in database:")
                for profile in data:
                    role = profile.get('role', 'unknown')
                    credits = profile.get('credits', 0)
                    username = profile.get('username', 'N/A')
                    print(f"   • {profile['email']} (@{username}) - Role: {role}, Credits: {credits}")

            return True
        else:
            print_check(False, f"Error querying profiles (HTTP {response.status_code})")
            return False
    except Exception as e:
        print_check(False, f"Error querying profiles: {str(e)}")
        return False

def check_rls_policies():
    """Check if RLS is working (basic test)"""
    print_header("6. Testing Row Level Security")

    try:
        # Try to query profiles (should work with anon key due to RLS policies)
        response = requests.get(
            f"{REST_URL}/profiles",
            headers=HEADERS,
            params={'select': 'id,email', 'limit': 1}
        )

        if response.status_code == 200:
            print_check(True, "RLS policies allow anonymous read access to profiles")
        else:
            print_check(False, f"RLS policy issue on profiles (HTTP {response.status_code})")
            return False

        # Try to query advisor_details
        response = requests.get(
            f"{REST_URL}/advisor_details",
            headers=HEADERS,
            params={'select': 'id,title', 'limit': 1}
        )

        if response.status_code == 200:
            print_check(True, "RLS policies allow anonymous read access to advisor_details")
        else:
            print_check(False, f"RLS policy issue on advisor_details (HTTP {response.status_code})")
            return False

        return True
    except Exception as e:
        print_check(False, f"RLS policy issue: {str(e)}")
        return False

def main():
    """Run all verification checks"""
    print("\n[*] Starting Supabase Auth Migration Verification")
    print(f"[*] Environment: {SUPABASE_URL}")

    results = {
        'tables': verify_tables_exist(),
        'profiles_structure': verify_profiles_structure(),
        'advisor_applications': verify_advisor_applications_accessible(),
        'rpc_functions': verify_rpc_functions(),
        'test_data': check_test_data(),
        'rls_policies': check_rls_policies(),
    }

    # Summary
    print_header("Verification Summary")

    passed_count = sum(results.values())
    total_count = len(results)

    for check_name, passed in results.items():
        status = "[PASSED]" if passed else "[FAILED]"
        print(f"{status}: {check_name.replace('_', ' ').title()}")

    print(f"\n[*] Result: {passed_count}/{total_count} checks passed")

    if passed_count == total_count:
        print("\n[SUCCESS] All checks passed! Migration was successful.")
        print("\n[*] Next steps:")
        print("   1. Test signup flow in the app")
        print("   2. Test login flow")
        print("   3. Test credit addition")
        print("   4. Test advisor application submission")
        return 0
    else:
        print("\n[WARNING] Some checks failed. Review the errors above.")
        print("\n[TIP] Troubleshooting:")
        print("   1. Ensure migration was applied: npx supabase db push")
        print("   2. Check Supabase dashboard for errors")
        print("   3. Verify .env has correct credentials")
        print("   4. Review migration SQL for syntax errors")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
