import { query } from '$app/server';
import { get_admin_dashboard } from '$server/admin/dashboard';
import { assert_admin } from '$server/auth/request_auth';

export const get_dashboard = query(async () => get_admin_dashboard(await assert_admin()));
