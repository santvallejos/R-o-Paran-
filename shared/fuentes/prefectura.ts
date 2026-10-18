// El parser vive junto a la Edge Function de Supabase (que sólo puede importar desde
// supabase/functions); acá se reexporta para la API de Vercel y la app.
export * from '../../supabase/functions/_shared/prefectura';
