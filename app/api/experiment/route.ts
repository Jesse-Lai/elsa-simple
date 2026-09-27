import { experiment, metrics, defaultConfig, evidence } from '@/lib/metis/data';
export async function GET(){return Response.json({experiment,metrics,config:defaultConfig,evidence,aiConfigured:Boolean(process.env.OPENAI_API_KEY?.trim()),model:process.env.OPENAI_MODEL||'gpt-5.6-terra'},{headers:{'Cache-Control':'no-store'}});}
