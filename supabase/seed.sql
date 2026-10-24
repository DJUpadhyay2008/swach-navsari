-- ==============================================================================
-- S.W.A.C.H. Navsari — Seed Data
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- ==============================================================================

-- Sample mock UUIDs for deterministic seed development
DO $$
DECLARE
    v_official_id UUID := '11111111-1111-4111-8111-111111111111';
    v_worker_id UUID   := '22222222-2222-4222-8222-222222222222';
    v_citizen_id UUID  := '33333333-3333-4333-8333-333333333333';
    v_report_1_id UUID := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    v_report_2_id UUID := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    v_report_3_id UUID := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    v_assignment_1_id UUID := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    v_event_1_id UUID  := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
BEGIN
    -- 1. Insert seed mock profiles (Safe demo accounts)
    INSERT INTO public.profiles (id, full_name, phone_number, ward_number, locality)
    VALUES
        (v_official_id, 'Kiritbhai Patel (Chief Sanitation Officer)', '+919876543210', 4, 'Lunsikui, Navsari'),
        (v_worker_id, 'Rameshbhai Solanki (Zone Lead Worker)', '+919876543211', 4, 'Tower Road, Navsari'),
        (v_citizen_id, 'Ananya Desai (Resident Volunteer)', '+919876543212', 7, 'Dudhia Talav, Navsari')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert protected user roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES
        (v_official_id, 'municipal_official'),
        (v_worker_id, 'sanitation_worker'),
        (v_citizen_id, 'citizen')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Insert sample realistic reports across Navsari localities
    -- Report 1: In progress at Dudhia Talav
    INSERT INTO public.reports (
        id,
        complaint_id,
        reporter_id,
        category,
        priority,
        status,
        description,
        latitude,
        longitude,
        address_locality,
        landmark,
        ward_number,
        submitted_at
    ) VALUES (
        v_report_1_id,
        'NAV-2026-00101',
        v_citizen_id,
        'garbage_dump',
        'high',
        'in_progress',
        'Large accumulation of mixed commercial and plastic packaging along the walking perimeter near Dudhia Talav park entrance.',
        20.9525,
        72.9325,
        'Dudhia Talav Garden Perimeter',
        'Near East Gate Children Play Area',
        7,
        timezone('utc'::text, now()) - INTERVAL '28 hours'
    ) ON CONFLICT (id) DO NOTHING;

    -- Report 2: Submitted at Lunsikui market
    INSERT INTO public.reports (
        id,
        complaint_id,
        reporter_id,
        category,
        priority,
        status,
        description,
        latitude,
        longitude,
        address_locality,
        landmark,
        ward_number,
        submitted_at
    ) VALUES (
        v_report_2_id,
        'NAV-2026-00102',
        v_citizen_id,
        'overflowing_bin',
        'urgent',
        'submitted',
        'Multiple municipal community bins overflowing into the vegetable market alley, obstructing pedestrian movement.',
        20.9467,
        72.9281,
        'Lunsikui Main Vegetable Market',
        'Opposite Sardar Complex',
        4,
        timezone('utc'::text, now()) - INTERVAL '4 hours'
    ) ON CONFLICT (id) DO NOTHING;

    -- Report 3: Resolved at Dandi Road junction
    INSERT INTO public.reports (
        id,
        complaint_id,
        reporter_id,
        category,
        priority,
        status,
        description,
        latitude,
        longitude,
        address_locality,
        landmark,
        ward_number,
        submitted_at,
        resolved_at
    ) VALUES (
        v_report_3_id,
        'NAV-2026-00098',
        v_citizen_id,
        'sewage_overflow',
        'urgent',
        'resolved',
        'Drainage manhole blockage causing storm runoff spillage on the highway approach road.',
        20.9380,
        72.9150,
        'Dandi Heritage Highway Approach',
        'Near Viraval Crossroad',
        2,
        timezone('utc'::text, now()) - INTERVAL '72 hours',
        timezone('utc'::text, now()) - INTERVAL '24 hours'
    ) ON CONFLICT (id) DO NOTHING;

    -- 4. Sample active assignment for Report 1
    INSERT INTO public.assignments (
        id,
        report_id,
        worker_id,
        assigned_by,
        status,
        assigned_at,
        started_at,
        notes
    ) VALUES (
        v_assignment_1_id,
        v_report_1_id,
        v_worker_id,
        v_official_id,
        'in_progress',
        timezone('utc'::text, now()) - INTERVAL '24 hours',
        timezone('utc'::text, now()) - INTERVAL '20 hours',
        'Dispatched Ward 7 mini-dumper and 4 personnel for clearing plastic waste around the talav.'
    ) ON CONFLICT (id) DO NOTHING;

    -- 5. Status history trail for Report 1
    INSERT INTO public.report_status_history (report_id, previous_status, new_status, actor_id, note, created_at)
    VALUES
        (v_report_1_id, NULL, 'submitted', v_citizen_id, 'Citizen submitted complaint with geo-tagged photos', timezone('utc'::text, now()) - INTERVAL '28 hours'),
        (v_report_1_id, 'submitted', 'assigned', v_official_id, 'Assigned to Ward 7 rapid sanitation unit lead Rameshbhai', timezone('utc'::text, now()) - INTERVAL '24 hours'),
        (v_report_1_id, 'assigned', 'in_progress', v_worker_id, 'Cleanliness crew arrived at Dudhia Talav site and commenced clearance', timezone('utc'::text, now()) - INTERVAL '20 hours')
    ON CONFLICT DO NOTHING;

    -- 6. Sample Community Cleanup Event in Navsari
    INSERT INTO public.cleanup_events (
        id,
        title,
        description,
        location_name,
        latitude,
        longitude,
        ward_number,
        scheduled_start,
        scheduled_end,
        organizer_id,
        status,
        max_volunteers
    ) VALUES (
        v_event_1_id,
        'Clean Dudhia Talav: Sunday Waterfront Citizen Action',
        'Join municipal staff and Navsari youth volunteers for a 2-hour morning clean-up, plastic collection drive, and lakefront reviving session.',
        'Dudhia Talav Lakeside Promenade, Navsari',
        20.9530,
        72.9330,
        7,
        timezone('utc'::text, now()) + INTERVAL '3 days 1 hour',
        timezone('utc'::text, now()) + INTERVAL '3 days 4 hours',
        v_official_id,
        'upcoming',
        50
    ) ON CONFLICT (id) DO NOTHING;

    -- 7. Participant Registration
    INSERT INTO public.event_participants (event_id, user_id, status)
    VALUES (v_event_1_id, v_citizen_id, 'registered')
    ON CONFLICT (event_id, user_id) DO NOTHING;

END $$;
