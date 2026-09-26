# ECC Gestor Local

Aplicação para coordenadores de grupos ECC organizarem encontros no computador.

## Comandos

```bash
npm install
npm run gestor              # navegador → http://localhost:3847
npm run gestor:seed         # importa Alimento do Amor
npm run gestor:desktop      # janela Electron (Windows/Mac)
npm run gestor:dist:win     # gera instalador Windows (.exe)
npm run gestor:dist:mac     # gera instalador macOS (.dmg) — rode no Mac
```

## Logo e publicação Netlify

1. Aba **Configuração** → enviar logo do grupo  
2. Aba **Publicar site** → Conectar Netlify (login Gmail/Google)  
3. Escolher ou digitar o nome do site  
4. **Criar/atualizar site e publicar** → URL `https://nome.netlify.app`

Instaladores ficam em `dist-gestor/` após o build.
