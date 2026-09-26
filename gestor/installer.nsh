; Custom NSIS — instalação e atualização do ECC Gestor
!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "ECC Gestor"
  !define MUI_WELCOMEPAGE_TEXT "Bem-vindo ao assistente do ECC Gestor.$\r$\n$\r$\nSe já existe uma versão instalada, este assistente irá atualizá-la.$\r$\n$\r$\nClique em Avançar para continuar."
  !define MUI_FINISHPAGE_TITLE "Concluído"
  !define MUI_FINISHPAGE_TEXT "O ECC Gestor foi instalado com sucesso.$\r$\n$\r$\nClique em Concluir para sair. Abra o aplicativo pelo atalho do menu Iniciar."
!macroend
