const https = require('https');

const supabaseUrl = 'https://zmvjekdibzefguzjqoaj.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptdmpla2RpYnplZmd1empxb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODQzMzMsImV4cCI6MjEwNzM2MDMzM30.jHY4ElgvMjUaz9s1nPOmgVfyM1ZRCZ8IyjhdN9j7jIM';

function getTable(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(endpoint, supabaseUrl);
        const options = {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Prefer': 'count=exact'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const contentRange = res.headers['content-range'];
                    resolve({ status: res.statusCode, data: parsed, range: contentRange });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        }).on('error', err => {
            resolve({ status: 0, error: err.message });
        });
    });
}

async function run() {
    const cats = await getTable('/rest/v1/categories?select=id,name,slug,is_published,created_at,updated_at');
    const prods = await getTable('/rest/v1/products?select=id,name,slug,category_id,is_published,created_at,updated_at');
    const banners = await getTable('/rest/v1/hero_banners?select=id,title,subtitle,image_url,is_published,display_order,created_at');
    const gallery = await getTable('/rest/v1/our_work_gallery?select=id,title,category,image_url,is_published,display_order,created_at');
    const enqs = await getTable('/rest/v1/enquiries?select=id,customer_name,phone,email,service_type,status,created_at');

    console.log('Categories Count:', cats.data ? cats.data.length : 'error', cats.data);
    console.log('Products Count:', prods.data ? prods.data.length : 'error', prods.data);
    console.log('Banners Count:', banners.data ? banners.data.length : 'error', banners.data);
    console.log('Gallery Count:', gallery.data ? gallery.data.length : 'error', gallery.data);
    console.log('Enquiries Status / Count:', enqs.status, enqs.data ? enqs.data.length : 'RLS protected (needs auth)');
}

run();
