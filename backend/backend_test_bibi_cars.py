#!/usr/bin/env python3
"""
BIBI Cars 2026-06 Admin-Curated Catalog Backend Testing
========================================================

Tests the new admin-curated car catalog endpoints that replaced
the VIN-based scraping/wishlist-deals workflow.

Public Endpoints:
  - GET /api/public/cars (list with budget filter)
  - GET /api/public/cars/buckets (counts per bucket)
  - GET /api/public/cars/search?q=<query> (autocomplete)
  - GET /api/public/cars/{slug_or_id} (detail + similar)
  - POST /api/public/leads/quick (lead submission)

Admin Endpoints:
  - GET /api/admin/cars (admin list)

Expected Seeded Cars:
  - Audi A6 2021 (38500€, 25-40K bucket)
  - BMW X5 2020
  - Tesla Model 3 2022
  - Volkswagen Golf 2019

Credentials:
  - Admin: admin@bibi.cars / Jp3FS_7ZuE2bhHp7rFkJm9B9T_TeiHxu
"""

import sys
import requests
from typing import Dict, Optional, Any
import json

BASE_URL = "https://auto-logistics-10.preview.emergentagent.com"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class BIBICarsTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.admin_token = None
        self.audi_slug = None
        
    def log(self, msg: str, color: str = Colors.RESET):
        print(f"{color}{msg}{Colors.RESET}")
    
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             token: Optional[str] = None, data: Optional[Dict] = None, 
             params: Optional[Dict] = None,
             validate_fn: Optional[callable] = None) -> tuple[bool, Any]:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        self.log(f"\n[{self.tests_run}] Testing: {name}", Colors.BLUE)
        self.log(f"    {method} {endpoint}")
        if params:
            self.log(f"    Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status code
            if response.status_code != expected_status:
                self.tests_failed += 1
                self.log(f"    ✗ FAILED - Expected {expected_status}, got {response.status_code}", Colors.RED)
                self.log(f"    Response: {response.text[:500]}", Colors.RED)
                return False, None
            
            # Parse response
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            # Run custom validation if provided
            if validate_fn:
                try:
                    validation_result = validate_fn(response_data)
                    if not validation_result:
                        self.tests_failed += 1
                        self.log(f"    ✗ FAILED - Validation failed", Colors.RED)
                        self.log(f"    Response: {json.dumps(response_data, indent=2)[:500]}", Colors.YELLOW)
                        return False, response_data
                except Exception as e:
                    self.tests_failed += 1
                    self.log(f"    ✗ FAILED - Validation error: {e}", Colors.RED)
                    return False, response_data
            
            self.tests_passed += 1
            self.log(f"    ✓ PASSED - Status {response.status_code}", Colors.GREEN)
            if validate_fn:
                self.log(f"    Validation passed", Colors.GREEN)
            
            return True, response_data
            
        except requests.exceptions.Timeout:
            self.tests_failed += 1
            self.log(f"    ✗ FAILED - Request timeout", Colors.RED)
            return False, None
        except Exception as e:
            self.tests_failed += 1
            self.log(f"    ✗ FAILED - Exception: {e}", Colors.RED)
            return False, None
    
    def login_admin(self):
        """Login as admin"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("ADMIN LOGIN", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        success, data = self.test(
            "Admin login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "admin@bibi.cars", "password": "Jp3FS_7ZuE2bhHp7rFkJm9B9T_TeiHxu"}
        )
        
        if success and data:
            self.admin_token = data.get('access_token')
            if self.admin_token:
                self.log(f"    Admin token obtained: {self.admin_token[:20]}...", Colors.GREEN)
            else:
                self.log(f"    Warning: No access_token in response", Colors.YELLOW)
                return False
        return success
    
    def test_public_cars_list(self):
        """Test GET /api/public/cars - list all published cars"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC CARS LIST", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        def validate(data):
            if not isinstance(data, dict):
                self.log(f"    Expected dict, got {type(data)}", Colors.RED)
                return False
            if 'items' not in data:
                self.log(f"    Missing 'items' key", Colors.RED)
                return False
            items = data['items']
            if not isinstance(items, list):
                self.log(f"    'items' should be list, got {type(items)}", Colors.RED)
                return False
            
            self.log(f"    Found {len(items)} cars", Colors.GREEN)
            
            # Check for expected seeded cars
            makes = [car.get('make', '').lower() for car in items]
            expected_makes = ['audi', 'bmw', 'tesla', 'volkswagen']
            found_makes = [m for m in expected_makes if m in makes]
            self.log(f"    Expected makes found: {found_makes}", Colors.GREEN)
            
            if len(items) >= 4:
                # Store Audi slug for later tests
                for car in items:
                    if car.get('make', '').lower() == 'audi':
                        self.audi_slug = car.get('slug') or car.get('id')
                        self.log(f"    Audi slug/id: {self.audi_slug}", Colors.GREEN)
                        break
            
            return len(items) >= 4
        
        return self.test(
            "Get all published cars",
            "GET",
            "/api/public/cars",
            200,
            validate_fn=validate
        )
    
    def test_public_cars_budget_filter(self):
        """Test GET /api/public/cars?budget=25_40k - filter by budget"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC CARS BUDGET FILTER", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        def validate(data):
            items = data.get('items', [])
            self.log(f"    Found {len(items)} cars in 25-40K bucket", Colors.GREEN)
            
            # Check if Audi A6 (38500€) is in this bucket
            audi_found = False
            for car in items:
                if car.get('make', '').lower() == 'audi':
                    audi_found = True
                    price = car.get('price_eur')
                    self.log(f"    Audi found with price: {price}€", Colors.GREEN)
                    if price and 25000 <= price < 40000:
                        self.log(f"    Price is in correct range", Colors.GREEN)
                    break
            
            return len(items) >= 1
        
        return self.test(
            "Filter cars by budget 25-40K",
            "GET",
            "/api/public/cars",
            200,
            params={"budget": "25_40k"},
            validate_fn=validate
        )
    
    def test_public_cars_buckets(self):
        """Test GET /api/public/cars/buckets - get counts per bucket"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC CARS BUCKETS", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        def validate(data):
            if 'counts' not in data:
                self.log(f"    Missing 'counts' key", Colors.RED)
                return False
            
            counts = data['counts']
            self.log(f"    Bucket counts: {counts}", Colors.GREEN)
            
            # Check expected buckets exist
            expected_buckets = ['all', 'under_10k', '10_15k', '15_25k', '25_40k', '40_60k', '60k_plus']
            for bucket in expected_buckets:
                if bucket not in counts:
                    self.log(f"    Missing bucket: {bucket}", Colors.RED)
                    return False
            
            total = data.get('total', 0)
            self.log(f"    Total cars: {total}", Colors.GREEN)
            
            return total >= 4
        
        return self.test(
            "Get bucket counts",
            "GET",
            "/api/public/cars/buckets",
            200,
            validate_fn=validate
        )
    
    def test_public_cars_search_audi(self):
        """Test GET /api/public/cars/search?q=audi - autocomplete search"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC CARS SEARCH - AUDI", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        def validate(data):
            if 'items' not in data:
                self.log(f"    Missing 'items' key", Colors.RED)
                return False
            
            items = data['items']
            self.log(f"    Found {len(items)} matches for 'audi'", Colors.GREEN)
            
            if len(items) > 0:
                audi = items[0]
                self.log(f"    First match: {audi.get('make')} {audi.get('model')} {audi.get('year')}", Colors.GREEN)
                self.log(f"    Price: {audi.get('price_eur')}€", Colors.GREEN)
                self.log(f"    Slug: {audi.get('slug')}", Colors.GREEN)
                
                # Verify it's actually an Audi
                if audi.get('make', '').lower() != 'audi':
                    self.log(f"    Expected Audi, got {audi.get('make')}", Colors.RED)
                    return False
            
            return len(items) >= 1
        
        return self.test(
            "Search for 'audi'",
            "GET",
            "/api/public/cars/search",
            200,
            params={"q": "audi"},
            validate_fn=validate
        )
    
    def test_public_cars_search_empty(self):
        """Test GET /api/public/cars/search?q=xxxx - no matches"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC CARS SEARCH - NO MATCH", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        def validate(data):
            items = data.get('items', [])
            self.log(f"    Found {len(items)} matches for 'xxxx' (expected 0)", Colors.GREEN)
            return len(items) == 0
        
        return self.test(
            "Search for non-existent car 'xxxx'",
            "GET",
            "/api/public/cars/search",
            200,
            params={"q": "xxxx"},
            validate_fn=validate
        )
    
    def test_public_car_detail(self):
        """Test GET /api/public/cars/{slug} - get car detail"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC CAR DETAIL", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        if not self.audi_slug:
            self.log("    Skipping - no Audi slug available", Colors.YELLOW)
            return True, None
        
        def validate(data):
            if 'car' not in data:
                self.log(f"    Missing 'car' key", Colors.RED)
                return False
            
            car = data['car']
            self.log(f"    Car: {car.get('make')} {car.get('model')} {car.get('year')}", Colors.GREEN)
            self.log(f"    Price: {car.get('price_eur')}€", Colors.GREEN)
            self.log(f"    Mileage: {car.get('mileage_km')} km", Colors.GREEN)
            self.log(f"    Admin badge: {car.get('admin_badge')}", Colors.GREEN)
            self.log(f"    Gallery: {len(car.get('gallery', []))} photos", Colors.GREEN)
            
            # Check for similar cars
            similar = data.get('similar', [])
            self.log(f"    Similar cars: {len(similar)}", Colors.GREEN)
            
            # Verify required fields
            required = ['id', 'slug', 'make', 'model', 'price_eur', 'budget_bucket']
            for field in required:
                if field not in car:
                    self.log(f"    Missing required field: {field}", Colors.RED)
                    return False
            
            return True
        
        return self.test(
            f"Get car detail by slug: {self.audi_slug}",
            "GET",
            f"/api/public/cars/{self.audi_slug}",
            200,
            validate_fn=validate
        )
    
    def test_public_lead_submission(self):
        """Test POST /api/public/leads/quick - submit a lead"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("PUBLIC LEAD SUBMISSION", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        lead_data = {
            "name": "Test User",
            "phone": "+380501234567",
            "email": "test@example.com",
            "message": "Interested in Audi A6",
            "source": "homepage_no_match",
            "car_preference": "Audi A6"
        }
        
        def validate(data):
            if not isinstance(data, dict):
                self.log(f"    Expected dict response", Colors.RED)
                return False
            
            # Check for success indicator
            if 'success' in data or 'leadId' in data or 'id' in data:
                self.log(f"    Lead submitted successfully", Colors.GREEN)
                if 'leadId' in data:
                    self.log(f"    Lead ID: {data['leadId']}", Colors.GREEN)
                return True
            
            self.log(f"    Response: {data}", Colors.YELLOW)
            return True  # Accept any 200 response
        
        return self.test(
            "Submit lead form",
            "POST",
            "/api/public/leads/quick",
            200,
            data=lead_data,
            validate_fn=validate
        )
    
    def test_admin_cars_list(self):
        """Test GET /api/admin/cars - admin list (requires auth)"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("ADMIN CARS LIST", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        if not self.admin_token:
            self.log("    Skipping - no admin token", Colors.YELLOW)
            return True, None
        
        def validate(data):
            if 'items' not in data:
                self.log(f"    Missing 'items' key", Colors.RED)
                return False
            
            items = data['items']
            self.log(f"    Found {len(items)} cars (including unpublished)", Colors.GREEN)
            
            # Check for admin-specific fields
            if len(items) > 0:
                car = items[0]
                self.log(f"    First car: {car.get('make')} {car.get('model')}", Colors.GREEN)
                self.log(f"    Published: {car.get('published')}", Colors.GREEN)
                self.log(f"    Sort order: {car.get('sort_order')}", Colors.GREEN)
            
            return len(items) >= 4
        
        return self.test(
            "Get admin cars list",
            "GET",
            "/api/admin/cars",
            200,
            token=self.admin_token,
            validate_fn=validate
        )
    
    def test_admin_cars_budget_filter(self):
        """Test GET /api/admin/cars?budget=25_40k - admin budget filter"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("ADMIN CARS BUDGET FILTER", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        if not self.admin_token:
            self.log("    Skipping - no admin token", Colors.YELLOW)
            return True, None
        
        def validate(data):
            items = data.get('items', [])
            self.log(f"    Found {len(items)} cars in 25-40K bucket", Colors.GREEN)
            return True
        
        return self.test(
            "Admin filter by budget 25-40K",
            "GET",
            "/api/admin/cars",
            200,
            token=self.admin_token,
            params={"budget": "25_40k"},
            validate_fn=validate
        )
    
    def run_all_tests(self):
        """Run all tests"""
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("BIBI CARS 2026-06 BACKEND TESTING", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        
        # Login
        if not self.login_admin():
            self.log("\n⚠️  Admin login failed - some tests will be skipped", Colors.YELLOW)
        
        # Public endpoints
        self.test_public_cars_list()
        self.test_public_cars_budget_filter()
        self.test_public_cars_buckets()
        self.test_public_cars_search_audi()
        self.test_public_cars_search_empty()
        self.test_public_car_detail()
        self.test_public_lead_submission()
        
        # Admin endpoints
        self.test_admin_cars_list()
        self.test_admin_cars_budget_filter()
        
        # Summary
        self.log("\n" + "="*60, Colors.BLUE)
        self.log("TEST SUMMARY", Colors.BLUE)
        self.log("="*60, Colors.BLUE)
        self.log(f"Total tests: {self.tests_run}", Colors.BLUE)
        self.log(f"Passed: {self.tests_passed}", Colors.GREEN)
        self.log(f"Failed: {self.tests_failed}", Colors.RED)
        
        if self.tests_failed == 0:
            self.log("\n✅ All tests passed!", Colors.GREEN)
            return 0
        else:
            self.log(f"\n❌ {self.tests_failed} test(s) failed", Colors.RED)
            return 1

if __name__ == "__main__":
    tester = BIBICarsTester()
    sys.exit(tester.run_all_tests())
