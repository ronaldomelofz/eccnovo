import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

export interface Encontro {
  ano: number;
  mes: string;
  dia: string;
  anfitriao: string;
  foto?: string;
  semFoto?: boolean;
  descricao: string;
}

const ENCONTROS_FILE = join(process.cwd(), 'app', 'data', 'encontros.ts')

// Função para ler encontros existentes
function readEncontros(): Encontro[] {
  try {
    const content = readFileSync(ENCONTROS_FILE, 'utf-8')
    // Extrair array de encontros do arquivo TypeScript
    const match = content.match(/export const encontros: Encontro\[\] = \[([\s\S]*?)\];/)
    if (!match) return []
    
    const arrayContent = match[1]
    const encontros: Encontro[] = []
    
    // Parse simples dos objetos encontros
    const lines = arrayContent.split('\n').filter(line => line.trim())
    let currentEncontro: Partial<Encontro> = {}
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('{')) {
        currentEncontro = {}
      } else if (trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map(s => s.trim())
        const cleanKey = key.replace(/[",]/g, '').trim()
        let cleanValue = value.replace(/[",]/g, '').trim()
        
        if (cleanKey === 'ano') {
          currentEncontro.ano = parseInt(cleanValue)
        } else if (cleanKey === 'mes') {
          currentEncontro.mes = cleanValue
        } else if (cleanKey === 'dia') {
          currentEncontro.dia = cleanValue
        } else if (cleanKey === 'anfitriao') {
          currentEncontro.anfitriao = cleanValue
        } else if (cleanKey === 'foto') {
          currentEncontro.foto = cleanValue
        } else if (cleanKey === 'semFoto') {
          currentEncontro.semFoto = cleanValue === 'true'
        } else if (cleanKey === 'descricao') {
          currentEncontro.descricao = cleanValue
        }
      } else if (trimmed === '},' || trimmed === '}') {
        if (currentEncontro.ano && currentEncontro.mes && currentEncontro.dia && 
            currentEncontro.anfitriao && currentEncontro.descricao) {
          encontros.push(currentEncontro as Encontro)
        }
        currentEncontro = {}
      }
    }
    
    return encontros
  } catch (error) {
    console.error('Erro ao ler encontros:', error)
    return []
  }
}

// Função para escrever encontros
function writeEncontros(encontros: Encontro[]): void {
  const content = `export interface Encontro {
  ano: number;
  mes: string;
  dia: string;
  anfitriao: string;
  foto?: string;
  semFoto?: boolean;
  descricao: string;
}

export const encontros: Encontro[] = [
${encontros.map(e => `  { ano: ${e.ano}, mes: "${e.mes}", dia: "${e.dia}", anfitriao: "${e.anfitriao}", ${e.foto ? `foto: "${e.foto}", ` : ''}${e.semFoto ? 'semFoto: true, ' : ''}descricao: "${e.descricao}" },`).join('\n')}
];
`
  
  writeFileSync(ENCONTROS_FILE, content, 'utf-8')
}

// GET - Buscar encontros
export async function GET() {
  try {
    const encontros = readEncontros()
    return NextResponse.json(encontros)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar encontros' }, { status: 500 })
  }
}

// POST - Adicionar novo encontro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ano, mes, dia, anfitriao, descricao, foto, semFoto } = body
    
    // Validação básica
    if (!ano || !mes || !dia || !anfitriao || !descricao) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }
    
    const encontros = readEncontros()
    const novoEncontro: Encontro = {
      ano: parseInt(ano),
      mes,
      dia: String(parseInt(dia, 10)).padStart(2, '0'),
      anfitriao,
      descricao,
      ...(semFoto ? { semFoto: true } : (foto ? { foto } : { semFoto: true }))
    }
    
    encontros.push(novoEncontro)
    writeEncontros(encontros)
    
    return NextResponse.json({ message: 'Encontro salvo com sucesso!', encontro: novoEncontro })
  } catch (error) {
    console.error('Erro ao salvar encontro:', error)
    return NextResponse.json({ error: 'Erro ao salvar encontro' }, { status: 500 })
  }
}

// DELETE - Remover encontro
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const index = parseInt(searchParams.get('index') || '0')
    
    const encontros = readEncontros()
    if (index < 0 || index >= encontros.length) {
      return NextResponse.json({ error: 'Índice inválido' }, { status: 400 })
    }
    
    encontros.splice(index, 1)
    writeEncontros(encontros)
    
    return NextResponse.json({ message: 'Encontro removido com sucesso!' })
  } catch (error) {
    console.error('Erro ao remover encontro:', error)
    return NextResponse.json({ error: 'Erro ao remover encontro' }, { status: 500 })
  }
}
