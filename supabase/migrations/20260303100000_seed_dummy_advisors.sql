-- =====================================================
-- Migration: Seed 20 Dummy Advisor Accounts
-- Date: 2026-03-03
-- Description: Create auth accounts, profiles, and
--              advisor_details for 20 test advisors
-- =====================================================

-- All advisors use password: Test1234!
-- Emails: advisor{N}@cosmiclly.test

-- Helper: create a DO block so we can use variables
DO $$
DECLARE
  v_hashed_password TEXT;
BEGIN
  -- Pre-hash the shared password once
  v_hashed_password := extensions.crypt('Test1234!', extensions.gen_salt('bf'));

  -- ================================================================
  -- ADVISOR 1: Psychic Luna (may already exist)
  -- UUID: 45dd82c1-c457-480b-af66-4c07bd0a9d01
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', '45dd82c1-c457-480b-af66-4c07bd0a9d01', 'authenticated', 'authenticated', 'advisor1@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Psychic","lastName":"Luna","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), '45dd82c1-c457-480b-af66-4c07bd0a9d01', jsonb_build_object('sub', '45dd82c1-c457-480b-af66-4c07bd0a9d01', 'email', 'advisor1@cosmiclly.test'), 'email', '45dd82c1-c457-480b-af66-4c07bd0a9d01', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 2: Master Chen
  -- UUID: d0000002-0000-4000-a000-000000000002
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000002-0000-4000-a000-000000000002', 'authenticated', 'authenticated', 'advisor2@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Master","lastName":"Chen","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000002-0000-4000-a000-000000000002', jsonb_build_object('sub', 'd0000002-0000-4000-a000-000000000002', 'email', 'advisor2@cosmiclly.test'), 'email', 'd0000002-0000-4000-a000-000000000002', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 3: Mystic Rose
  -- UUID: d0000003-0000-4000-a000-000000000003
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000003-0000-4000-a000-000000000003', 'authenticated', 'authenticated', 'advisor3@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Mystic","lastName":"Rose","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000003-0000-4000-a000-000000000003', jsonb_build_object('sub', 'd0000003-0000-4000-a000-000000000003', 'email', 'advisor3@cosmiclly.test'), 'email', 'd0000003-0000-4000-a000-000000000003', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 4: Spirit Guide Sam
  -- UUID: d0000004-0000-4000-a000-000000000004
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000004-0000-4000-a000-000000000004', 'authenticated', 'authenticated', 'advisor4@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Spirit Guide","lastName":"Sam","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000004-0000-4000-a000-000000000004', jsonb_build_object('sub', 'd0000004-0000-4000-a000-000000000004', 'email', 'advisor4@cosmiclly.test'), 'email', 'd0000004-0000-4000-a000-000000000004', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 5: Oracle Maya
  -- UUID: d0000005-0000-4000-a000-000000000005
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000005-0000-4000-a000-000000000005', 'authenticated', 'authenticated', 'advisor5@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Oracle","lastName":"Maya","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000005-0000-4000-a000-000000000005', jsonb_build_object('sub', 'd0000005-0000-4000-a000-000000000005', 'email', 'advisor5@cosmiclly.test'), 'email', 'd0000005-0000-4000-a000-000000000005', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 6: Crystal Claire
  -- UUID: d0000006-0000-4000-a000-000000000006
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000006-0000-4000-a000-000000000006', 'authenticated', 'authenticated', 'advisor6@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Crystal","lastName":"Claire","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000006-0000-4000-a000-000000000006', jsonb_build_object('sub', 'd0000006-0000-4000-a000-000000000006', 'email', 'advisor6@cosmiclly.test'), 'email', 'd0000006-0000-4000-a000-000000000006', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 7: Sage Alexander
  -- UUID: d0000007-0000-4000-a000-000000000007
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000007-0000-4000-a000-000000000007', 'authenticated', 'authenticated', 'advisor7@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Sage","lastName":"Alexander","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000007-0000-4000-a000-000000000007', jsonb_build_object('sub', 'd0000007-0000-4000-a000-000000000007', 'email', 'advisor7@cosmiclly.test'), 'email', 'd0000007-0000-4000-a000-000000000007', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 8: Starlight Sophia
  -- UUID: d0000008-0000-4000-a000-000000000008
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000008-0000-4000-a000-000000000008', 'authenticated', 'authenticated', 'advisor8@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Starlight","lastName":"Sophia","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000008-0000-4000-a000-000000000008', jsonb_build_object('sub', 'd0000008-0000-4000-a000-000000000008', 'email', 'advisor8@cosmiclly.test'), 'email', 'd0000008-0000-4000-a000-000000000008', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 9: Aurora Skye
  -- UUID: d0000009-0000-4000-a000-000000000009
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000009-0000-4000-a000-000000000009', 'authenticated', 'authenticated', 'advisor9@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Aurora","lastName":"Skye","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000009-0000-4000-a000-000000000009', jsonb_build_object('sub', 'd0000009-0000-4000-a000-000000000009', 'email', 'advisor9@cosmiclly.test'), 'email', 'd0000009-0000-4000-a000-000000000009', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 10: Destiny Dawn
  -- UUID: d0000010-0000-4000-a000-000000000010
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000010-0000-4000-a000-000000000010', 'authenticated', 'authenticated', 'advisor10@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Destiny","lastName":"Dawn","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000010-0000-4000-a000-000000000010', jsonb_build_object('sub', 'd0000010-0000-4000-a000-000000000010', 'email', 'advisor10@cosmiclly.test'), 'email', 'd0000010-0000-4000-a000-000000000010', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 11: Phoenix Fire
  -- UUID: d0000011-0000-4000-a000-000000000011
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000011-0000-4000-a000-000000000011', 'authenticated', 'authenticated', 'advisor11@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Phoenix","lastName":"Fire","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000011-0000-4000-a000-000000000011', jsonb_build_object('sub', 'd0000011-0000-4000-a000-000000000011', 'email', 'advisor11@cosmiclly.test'), 'email', 'd0000011-0000-4000-a000-000000000011', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 12: Harmony Hope
  -- UUID: d0000012-0000-4000-a000-000000000012
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000012-0000-4000-a000-000000000012', 'authenticated', 'authenticated', 'advisor12@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Harmony","lastName":"Hope","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000012-0000-4000-a000-000000000012', jsonb_build_object('sub', 'd0000012-0000-4000-a000-000000000012', 'email', 'advisor12@cosmiclly.test'), 'email', 'd0000012-0000-4000-a000-000000000012', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 13: Cosmic Carlos
  -- UUID: d0000013-0000-4000-a000-000000000013
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000013-0000-4000-a000-000000000013', 'authenticated', 'authenticated', 'advisor13@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Cosmic","lastName":"Carlos","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000013-0000-4000-a000-000000000013', jsonb_build_object('sub', 'd0000013-0000-4000-a000-000000000013', 'email', 'advisor13@cosmiclly.test'), 'email', 'd0000013-0000-4000-a000-000000000013', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 14: Serene Sarah
  -- UUID: d0000014-0000-4000-a000-000000000014
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000014-0000-4000-a000-000000000014', 'authenticated', 'authenticated', 'advisor14@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Serene","lastName":"Sarah","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000014-0000-4000-a000-000000000014', jsonb_build_object('sub', 'd0000014-0000-4000-a000-000000000014', 'email', 'advisor14@cosmiclly.test'), 'email', 'd0000014-0000-4000-a000-000000000014', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 15: Mystic Marcus
  -- UUID: d0000015-0000-4000-a000-000000000015
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000015-0000-4000-a000-000000000015', 'authenticated', 'authenticated', 'advisor15@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Mystic","lastName":"Marcus","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000015-0000-4000-a000-000000000015', jsonb_build_object('sub', 'd0000015-0000-4000-a000-000000000015', 'email', 'advisor15@cosmiclly.test'), 'email', 'd0000015-0000-4000-a000-000000000015', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 16: Divine Diana
  -- UUID: d0000016-0000-4000-a000-000000000016
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000016-0000-4000-a000-000000000016', 'authenticated', 'authenticated', 'advisor16@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Divine","lastName":"Diana","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000016-0000-4000-a000-000000000016', jsonb_build_object('sub', 'd0000016-0000-4000-a000-000000000016', 'email', 'advisor16@cosmiclly.test'), 'email', 'd0000016-0000-4000-a000-000000000016', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 17: Wisdom Walker
  -- UUID: d0000017-0000-4000-a000-000000000017
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000017-0000-4000-a000-000000000017', 'authenticated', 'authenticated', 'advisor17@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Wisdom","lastName":"Walker","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000017-0000-4000-a000-000000000017', jsonb_build_object('sub', 'd0000017-0000-4000-a000-000000000017', 'email', 'advisor17@cosmiclly.test'), 'email', 'd0000017-0000-4000-a000-000000000017', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 18: Celestial Celia
  -- UUID: d0000018-0000-4000-a000-000000000018
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000018-0000-4000-a000-000000000018', 'authenticated', 'authenticated', 'advisor18@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Celestial","lastName":"Celia","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000018-0000-4000-a000-000000000018', jsonb_build_object('sub', 'd0000018-0000-4000-a000-000000000018', 'email', 'advisor18@cosmiclly.test'), 'email', 'd0000018-0000-4000-a000-000000000018', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 19: Radiant Ray
  -- UUID: d0000019-0000-4000-a000-000000000019
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000019-0000-4000-a000-000000000019', 'authenticated', 'authenticated', 'advisor19@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Radiant","lastName":"Ray","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000019-0000-4000-a000-000000000019', jsonb_build_object('sub', 'd0000019-0000-4000-a000-000000000019', 'email', 'advisor19@cosmiclly.test'), 'email', 'd0000019-0000-4000-a000-000000000019', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- ADVISOR 20: Luna Light
  -- UUID: d0000020-0000-4000-a000-000000000020
  -- ================================================================
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', 'd0000020-0000-4000-a000-000000000020', 'authenticated', 'authenticated', 'advisor20@cosmiclly.test', v_hashed_password, NOW(), '{"provider":"email","providers":["email"]}', '{"firstName":"Luna","lastName":"Light","isAdvisor":true}', NOW(), NOW(), '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'd0000020-0000-4000-a000-000000000020', jsonb_build_object('sub', 'd0000020-0000-4000-a000-000000000020', 'email', 'advisor20@cosmiclly.test'), 'email', 'd0000020-0000-4000-a000-000000000020', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

END$$;

-- ================================================================
-- UPDATE PROFILES — set avatar, credits, role for all 20
-- (trigger created base profiles; we now enrich them)
-- ================================================================

UPDATE public.profiles SET full_name = 'Psychic Luna', avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = '45dd82c1-c457-480b-af66-4c07bd0a9d01';
UPDATE public.profiles SET full_name = 'Master Chen', avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000002-0000-4000-a000-000000000002';
UPDATE public.profiles SET full_name = 'Mystic Rose', avatar_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000003-0000-4000-a000-000000000003';
UPDATE public.profiles SET full_name = 'Spirit Guide Sam', avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000004-0000-4000-a000-000000000004';
UPDATE public.profiles SET full_name = 'Oracle Maya', avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000005-0000-4000-a000-000000000005';
UPDATE public.profiles SET full_name = 'Crystal Claire', avatar_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000006-0000-4000-a000-000000000006';
UPDATE public.profiles SET full_name = 'Sage Alexander', avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000007-0000-4000-a000-000000000007';
UPDATE public.profiles SET full_name = 'Starlight Sophia', avatar_url = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000008-0000-4000-a000-000000000008';
UPDATE public.profiles SET full_name = 'Aurora Skye', avatar_url = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000009-0000-4000-a000-000000000009';
UPDATE public.profiles SET full_name = 'Destiny Dawn', avatar_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000010-0000-4000-a000-000000000010';
UPDATE public.profiles SET full_name = 'Phoenix Fire', avatar_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000011-0000-4000-a000-000000000011';
UPDATE public.profiles SET full_name = 'Harmony Hope', avatar_url = 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000012-0000-4000-a000-000000000012';
UPDATE public.profiles SET full_name = 'Cosmic Carlos', avatar_url = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000013-0000-4000-a000-000000000013';
UPDATE public.profiles SET full_name = 'Serene Sarah', avatar_url = 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000014-0000-4000-a000-000000000014';
UPDATE public.profiles SET full_name = 'Mystic Marcus', avatar_url = 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000015-0000-4000-a000-000000000015';
UPDATE public.profiles SET full_name = 'Divine Diana', avatar_url = 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000016-0000-4000-a000-000000000016';
UPDATE public.profiles SET full_name = 'Wisdom Walker', avatar_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000017-0000-4000-a000-000000000017';
UPDATE public.profiles SET full_name = 'Celestial Celia', avatar_url = 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000018-0000-4000-a000-000000000018';
UPDATE public.profiles SET full_name = 'Radiant Ray', avatar_url = 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000019-0000-4000-a000-000000000019';
UPDATE public.profiles SET full_name = 'Luna Light', avatar_url = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', credits = 100, role = 'advisor' WHERE id = 'd0000020-0000-4000-a000-000000000020';

-- ================================================================
-- UPSERT ADVISOR_DETAILS — full advisor data for all 20
-- ================================================================

INSERT INTO public.advisor_details (id, title, bio_short, specialties, years_experience, price_per_minute, discounted_price, free_minutes, status, is_top_rated, profile_complete)
VALUES
  ('45dd82c1-c457-480b-af66-4c07bd0a9d01', '5 Star Love Expert', 'Gifted empath and clairvoyant specializing in matters of the heart. Let me guide you to your true love.', ARRAY['Love Advice','Intuitive Readings','Compatibility'], 13, 3.99, 1.99, 3, 'online', true, true),
  ('d0000002-0000-4000-a000-000000000002', 'Astrology & Numerology', 'Ancient wisdom meets modern insight. Discover your cosmic destiny through the stars.', ARRAY['Astrology Insights','Numerology','Destiny Insights','Future Predictions'], 11, 4.99, 2.49, 3, 'online', true, true),
  ('d0000003-0000-4000-a000-000000000003', 'Tarot Card Reader', 'Third-generation tarot reader with intuitive gifts. Every card tells your story.', ARRAY['Tarot Guidance','Intuitive Readings','Career Guidance'], 8, 2.99, NULL, 0, 'online', false, true),
  ('d0000004-0000-4000-a000-000000000004', 'Psychic Medium', 'Connect with departed loved ones and receive messages from beyond the veil.', ARRAY['Psychic Mediumship','Spiritual Coaching','Emotional Healing','Past Lives'], 7, 5.99, 2.99, 3, 'online', true, true),
  ('d0000005-0000-4000-a000-000000000005', 'Dream Interpreter', 'Unlock the secrets of your subconscious. Your dreams hold the answers you seek.', ARRAY['Dream Analysis','Intuitive Readings','Past Lives'], 6, 2.49, NULL, 0, 'online', false, true),
  ('d0000006-0000-4000-a000-000000000006', 'Energy Healer', 'Restore balance and harmony through crystal energy and chakra alignment.', ARRAY['Energy Readings','Aura Reading','Emotional Healing','Spiritual Coaching'], 9, 3.49, 1.99, 3, 'online', false, true),
  ('d0000007-0000-4000-a000-000000000007', 'Career & Finance', 'Navigate your professional path with clarity. Success is written in the stars.', ARRAY['Career Guidance','Life Coaching','Manifestation','Numerology'], 10, 4.49, 2.49, 0, 'online', false, true),
  ('d0000008-0000-4000-a000-000000000008', 'Clairvoyant', 'See beyond the veil of time. Your future awaits revelation.', ARRAY['Future Predictions','Destiny Insights','Intuitive Readings'], 12, 5.99, NULL, 0, 'online', true, true),
  ('d0000009-0000-4000-a000-000000000009', 'Aura Specialist', 'See the colors of your soul. Your aura reveals your deepest truths.', ARRAY['Aura Reading','Energy Readings','Spiritual Coaching','Emotional Healing'], 7, 3.29, 1.79, 3, 'online', false, true),
  ('d0000010-0000-4000-a000-000000000010', 'Palm Reader', 'Your hands hold the map to your destiny. Let me read the lines of fate.', ARRAY['Palm Reading','Future Predictions','Love Advice','Destiny Insights'], 5, 2.79, NULL, 0, 'online', false, true),
  ('d0000011-0000-4000-a000-000000000011', 'Past Life Expert', 'Explore the echoes of your soul across lifetimes. Heal the past to embrace the future.', ARRAY['Past Lives','Spiritual Coaching','Emotional Healing','Energy Readings','Aura Reading'], 11, 4.99, NULL, 0, 'online', true, true),
  ('d0000012-0000-4000-a000-000000000012', 'Relationship Coach', 'Build lasting connections. Find harmony in your relationships and within yourself.', ARRAY['Love Advice','Compatibility','Life Coaching','Emotional Healing'], 8, 3.49, 1.99, 3, 'online', false, true),
  ('d0000013-0000-4000-a000-000000000013', 'Astrologer', 'The stars speak to those who listen. Let me translate their cosmic messages for you.', ARRAY['Astrology Insights','Numerology','Compatibility','Future Predictions','Destiny Insights'], 10, 4.29, 2.29, 0, 'online', false, true),
  ('d0000014-0000-4000-a000-000000000014', 'Manifestation Guide', 'Transform your dreams into reality. The universe responds to focused intention.', ARRAY['Manifestation','Life Coaching','Spiritual Coaching','Energy Readings'], 9, 3.99, NULL, 0, 'online', true, true),
  ('d0000015-0000-4000-a000-000000000015', 'Tarot Master', 'The cards reveal what the heart already knows. Let the Tarot guide your path.', ARRAY['Tarot Guidance','Intuitive Readings','Love Advice','Career Guidance'], 7, 3.29, NULL, 0, 'online', false, true),
  ('d0000016-0000-4000-a000-000000000016', 'Spiritual Medium', 'Bridge the gap between worlds. Messages from beyond bring comfort and clarity.', ARRAY['Psychic Mediumship','Spiritual Coaching','Emotional Healing','Past Lives','Energy Readings'], 14, 5.99, NULL, 0, 'online', true, true),
  ('d0000017-0000-4000-a000-000000000017', 'Life Path Advisor', 'Navigate life''s crossroads with confidence. Your path is clearer than you think.', ARRAY['Life Coaching','Numerology','Destiny Insights','Career Guidance'], 8, 3.79, 2.19, 3, 'online', false, true),
  ('d0000018-0000-4000-a000-000000000018', 'Dream Analyst', 'Your dreams are messages from your higher self. Let me help you decode them.', ARRAY['Dream Analysis','Intuitive Readings','Past Lives','Spiritual Coaching'], 6, 2.99, NULL, 0, 'online', false, true),
  ('d0000019-0000-4000-a000-000000000019', 'Energy Master', 'Feel the flow of universal energy. Align your vibration with your highest purpose.', ARRAY['Energy Readings','Aura Reading','Emotional Healing','Manifestation','Spiritual Coaching'], 10, 4.49, 2.49, 0, 'online', false, true),
  ('d0000020-0000-4000-a000-000000000020', 'Love Psychic', 'Love is the greatest adventure. Let me illuminate the path to your heart''s desire.', ARRAY['Love Advice','Compatibility','Tarot Guidance','Future Predictions'], 9, 3.99, NULL, 0, 'online', false, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  bio_short = EXCLUDED.bio_short,
  specialties = EXCLUDED.specialties,
  years_experience = EXCLUDED.years_experience,
  price_per_minute = EXCLUDED.price_per_minute,
  discounted_price = EXCLUDED.discounted_price,
  free_minutes = EXCLUDED.free_minutes,
  status = EXCLUDED.status,
  is_top_rated = EXCLUDED.is_top_rated,
  profile_complete = EXCLUDED.profile_complete;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
COMMENT ON TABLE public.advisor_details IS 'Extended details for advisor profiles. 20 test advisors seeded.';
