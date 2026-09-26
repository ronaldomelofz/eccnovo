; Custom NSIS — mensagem de atualização do ECC Gestor
!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "Atualização do ECC Gestor"
  !define MUI_WELCOMEPAGE_TEXT "O sistema está em processo de atualização.$\r$\n$\r$\nSiga as instruções deste assistente para concluir a instalação da nova versão.$\r$\n$\r$\nClique em Avançar para continuar."
  !define MUI_FINISHPAGE_TITLE "Atualização concluída"
  !define MUI_FINISHPAGE_TEXT "A atualização do ECC Gestor foi instalada.$\r$\n$\r$\nClique em Concluir para sair."
!macroend
