export interface Encontro {
  ano: number;
  mes: string;
  dia: string;
  anfitriao: string;
  foto?: string;
  semFoto?: boolean;
  descricao: string;
}

export const encontros: Encontro[] = [
  // 2023
  { ano: 2023, mes: "Maio", dia: "23", anfitriao: "ROBERVAL E IARA", foto: "/FOTOS/ENCONTRO-01-23-05-2023.jpeg", descricao: "1º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Junho", dia: "07", anfitriao: "JOÃO MAURICIO E FERNANDA", foto: "/FOTOS/ENCONTRO-02-07-06-2023.jpeg", descricao: "2º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Junho", dia: "18", anfitriao: "RIBINHA E ROSANA", foto: "/FOTOS/ENCONTRO-03-18-06-2023.jpeg", descricao: "3º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Julho", dia: "28", anfitriao: "RAULINO E NAIR", foto: "/FOTOS/ENCONTRO-04-28-07-2026.jpeg", descricao: "4º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Agosto", dia: "23", anfitriao: "RUBENS E FERNANDA", foto: "/FOTOS/ENCONTRO-05-23-08-2023.jpeg", descricao: "5º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Setembro", dia: "15", anfitriao: "RONALD E SARA", foto: "/FOTOS/ENCONTRO-06-15-09-2023.jpeg", descricao: "6º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Setembro", dia: "28", anfitriao: "HUGO E YANE", foto: "/FOTOS/ENCONTRO-07-28-09-2023.jpeg", descricao: "7º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Outubro", dia: "21", anfitriao: "RONALDO E SANDRA", foto: "/FOTOS/ENCONTRO-08-21-10-2023.jpeg", descricao: "8º ENCONTRO 1º TEMÁRIO" },
  { ano: 2023, mes: "Novembro", dia: "16", anfitriao: "MARCIO E FERNANDA", foto: "/FOTOS/ENCONTRO-09-16-11-2023.jpeg", descricao: "9º ENCONTRO 2º TEMÁRIO" },
  { ano: 2023, mes: "Dezembro", dia: "08", anfitriao: "ROBERVAL E IARA", foto: "/FOTOS/ENCONTRO-10-08-12-2023.jpeg", descricao: "10º ENCONTRO 2º TEMÁRIO" },
  // 2024
  { ano: 2024, mes: "Janeiro", dia: "25", anfitriao: "HUGO E YANE", foto: "/FOTOS/ENCONTRO-11-25-01-2024.jpeg", descricao: "11º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Fevereiro", dia: "17", anfitriao: "JOÃO MAURICIO E FERNANDA", foto: "/FOTOS/ENCONTRO-12-17-02-2024.jpeg", descricao: "12º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Março", dia: "08", anfitriao: "RONALD E SARA", foto: "/FOTOS/ENCONTRO-13-08-03-2024.jpeg", descricao: "13º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Março", dia: "15", anfitriao: "RONALDO E SANDRA", foto: "/FOTOS/ENCONTRO-14-15-03-2024.jpeg", descricao: "14º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Abril", dia: "05", anfitriao: "RAULINO E NAIR", semFoto: true, descricao: "15º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Abril", dia: "19", anfitriao: "MAURO E DALIANE", foto: "/FOTOS/ENCONTRO-16-19-04-2024.jpeg", descricao: "16º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Maio", dia: "10", anfitriao: "RIBINHA E ROSANA", foto: "/FOTOS/ENCONTRO-17-10-05-2024.jpeg", descricao: "1º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Maio", dia: "30", anfitriao: "RUBENS E FERNANDA", foto: "/FOTOS/ENCONTRO-18-30-05-2024.jpeg", descricao: "2º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Junho", dia: "20", anfitriao: "MARCIO E FERNANDA", foto: "/FOTOS/ENCONTRO-19-20-06-2024.jpeg", descricao: "3º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Agosto", dia: "08", anfitriao: "ROBERVAL E IARA", foto: "/FOTOS/ENCONTRO-20-08-08-2024.jpeg", descricao: "4º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Agosto", dia: "31", anfitriao: "JOÃO MAURICIO E FERNANDA", foto: "/FOTOS/ENCONTRO-21-31-08-2024.jpeg", descricao: "5º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Setembro", dia: "26", anfitriao: "RIBINHA E ROSANA", foto: "/FOTOS/ENCONTRO-22-26-09-2024.jpeg", descricao: "6º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Outubro", dia: "18", anfitriao: "RAULINO E NAIR", foto: "/FOTOS/ENCONTRO-23-18-10-2024.jpeg", descricao: "7º ENCONTRO 2º TEMÁRIO" },
  { ano: 2024, mes: "Novembro", dia: "14", anfitriao: "HUGO E YANE", foto: "/FOTOS/ENCONTRO-24-14-11-2024.jpeg", descricao: "8º ENCONTRO 2º TEMÁRIO" },
  // 2025
  { ano: 2025, mes: "Janeiro", dia: "17", anfitriao: "RONALD E SARA", foto: "/FOTOS/ENCONTRO-25-17-01-2025.jpeg", descricao: "9º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Fevereiro", dia: "08", anfitriao: "RONALDO E SANDRA", foto: "/FOTOS/ENCONTRO-26-08-02-2025.jpeg", descricao: "10º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Março", dia: "15", anfitriao: "RUBENS E FERNANDA", foto: "/FOTOS/ENCONTRO-27-15-03-2025.jpeg", descricao: "11º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Abril", dia: "11", anfitriao: "MAURO E DALIANE", foto: "/FOTOS/ENCONTRO-28-11-04-2025-.png", descricao: "12º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Maio", dia: "23", anfitriao: "MARCIO E FERNANDA", foto: "/FOTOS/ENCONTRO-29-23-05-2025-.jpeg", descricao: "13º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Junho", dia: "12", anfitriao: "ROBERVAL E IARA", foto: "/FOTOS/ENCONTRO-30-12-06-2025.jpeg", descricao: "14º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Julho", dia: "02", anfitriao: "JOÃO MAURICIO E FERNANDA", foto: "/FOTOS/ENCONTRO-31-02-07-2025.jpeg", descricao: "15º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Agosto", dia: "29", anfitriao: "RIBINHA E ROSANA", foto: "/FOTOS/ENCONTRO-32-29-08-2025.jpeg", descricao: "16º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Setembro", dia: "03", anfitriao: "RAULINO E NAIR", foto: "/FOTOS/ENCONTRO-33-03-09-2025.jpeg", descricao: "17º ENCONTRO 2º TEMÁRIO" },
  { ano: 2025, mes: "Outubro", dia: "15", anfitriao: "RONALDO E SANDRA", foto: "/FOTOS/ENCONTRO-34-15-10-2025.jpeg", descricao: "18º ENCONTRO 2º TEMÁRIO" },
];
