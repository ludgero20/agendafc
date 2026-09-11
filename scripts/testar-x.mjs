// scripts/testar-x.mjs
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

async function testarPostagem() {
  console.log('🤖 Tentando publicar um tweet de teste...');
  try {
    const textoTeste = `🚀 Teste de automação do Agenda FC no X!\n\nGuia de jogos e tabelas em tempo real: https://agendafc.com.br`;
    const resultado = await client.v2.tweet(textoTeste);
    console.log('✅ SUCESSO ABSOLUTO! Tweet publicado com sucesso!');
    console.log(`🔗 ID do Tweet: ${resultado.data.id}`);
  } catch (error) {
    console.error('❌ Erro na autenticação do X:', error);
  }
}

testarPostagem();