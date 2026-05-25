import {
    createClient
}
from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* Supabase 주소 */
const supabaseUrl =
"https://ygawovdhanoomygjirfb.supabase.co";

/* API KEY */
const supabaseKey =
"sb_publishable_NC0XPupOoCRVFOspUNyXwg_ur9-lWUY";

/* 연결 */
export const supabase =
createClient(
    supabaseUrl,
    supabaseKey
);