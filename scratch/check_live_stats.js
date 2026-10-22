import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const configJs = fs.readFileSync('js/config.js', 'utf8');
const urlMatch = configJs.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configJs.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if (!urlMatch || !keyMatch) {
    console.error('Credentials not found');
    process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkData() {
    const [cats, prods, banners, gallery, enqs] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
        supabase.from('hero_banners').select('*'),
        supabase.from('our_work_gallery').select('*'),
        supabase.from('enquiries').select('*')
    ]);

    console.log('Categories:', cats.data ? cats.data.length : 'err', cats.error?.message || '');
    if (cats.data) console.log('  Cats sample:', cats.data.map(c => ({ id: c.id, name: c.name, is_published: c.is_published })));

    console.log('Products:', prods.data ? prods.data.length : 'err', prods.error?.message || '');
    if (prods.data) console.log('  Prods sample:', prods.data.map(p => ({ id: p.id, name: p.name, cat: p.category_id, is_published: p.is_published })));

    console.log('Hero Banners:', banners.data ? banners.data.length : 'err', banners.error?.message || '');
    if (banners.data) console.log('  Banners sample:', banners.data.map(b => ({ id: b.id, title: b.title, is_published: b.is_published })));

    console.log('Gallery:', gallery.data ? gallery.data.length : 'err', gallery.error?.message || '');
    if (gallery.data) console.log('  Gallery sample:', gallery.data.map(g => ({ id: g.id, title: g.title, is_published: g.is_published })));

    console.log('Enquiries:', enqs.data ? enqs.data.length : 'err', enqs.error?.message || '');
    if (enqs.data) console.log('  Enquiries sample:', enqs.data.map(e => ({ id: e.id, name: e.customer_name, status: e.status })));
}

checkData();
