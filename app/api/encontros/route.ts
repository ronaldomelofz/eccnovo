import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export interface Encontro {
  ano: number;
  mes: string;
  dia: string;
  anfitriao: string;
  foto?: string;
  semFoto?: boolean;
  descricao: string;
}

const ENCONTROS_KEY = 'ecc:encontros'

// GET - Buscar encontros
export async function GET() {
  try {
    // Buscar encontros do KV
    let encontros: Encontro[] = await kv.get(ENCONTROS_KEY) || []
    
    // Se não houver encontros no KV, usar os dados estáticos como fallback
    if (encontros.length === 0) {
      const { encontros: encontrosEstaticos } = await import('../../data/encontros')
      encontros = encontrosEstaticos
    }
    
    return NextResponse.json(encontros)
  } catch (error) {
    console.error('Erro ao buscar encontros:', error)
    // Em caso de erro, retornar dados estáticos
    const { encontros: encontrosEstaticos } = await import('../../data/encontros')
    return NextResponse.json(encontrosEstaticos)
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
    
    // Buscar encontros existentes
    let encontros: Encontro[] = await kv.get(ENCONTROS_KEY) || []
    
    // Se não houver encontros no KV, inicializar com dados estáticos
    if (encontros.length === 0) {
      const { encontros: encontrosEstaticos } = await import('../../data/encontros')
      encontros = encontrosEstaticos
    }
    
    // Criar novo encontro
    const novoEncontro: Encontro = {
      ano: parseInt(ano),
      mes,
      dia: String(parseInt(dia, 10)).padStart(2, '0'),
      anfitriao,
      descricao,
      ...(semFoto ? { semFoto: true } : (foto ? { foto } : { semFoto: true }))
    }
    
    // Adicionar e salvar
    encontros.push(novoEncontro)
    await kv.set(ENCONTROS_KEY, encontros)
    
    return NextResponse.json({ 
      message: 'Encontro salvo com sucesso!', 
      encontro: novoEncontro 
    })
  } catch (error) {
    console.error('Erro ao salvar encontro:', error)
    return NextResponse.json({ 
      error: 'Erro ao salvar encontro: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    }, { status: 500 })
  }
}

// DELETE - Remover encontro
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const index = parseInt(searchParams.get('index') || '0')
    
    // Buscar encontros
    let encontros: Encontro[] = await kv.get(ENCONTROS_KEY) || []
    
    if (encontros.length === 0) {
      return NextResponse.json({ error: 'Nenhum encontro encontrado' }, { status: 404 })
    }
    
    if (index < 0 || index >= encontros.length) {
      return NextResponse.json({ error: 'Índice inválido' }, { status: 400 })
    }
    
    // Remover e salvar
    encontros.splice(index, 1)
    await kv.set(ENCONTROS_KEY, encontros)
    
    return NextResponse.json({ message: 'Encontro removido com sucesso!' })
  } catch (error) {
    console.error('Erro ao remover encontro:', error)
    return NextResponse.json({ 
      error: 'Erro ao remover encontro: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    }, { status: 500 })
  }
}

// PUT - Inicializar dados estáticos no KV (executar uma vez)
export async function PUT() {
  try {
    const { encontros: encontrosEstaticos } = await import('../../data/encontros')
    await kv.set(ENCONTROS_KEY, encontrosEstaticos)
    
    return NextResponse.json({ 
      message: 'Dados inicializados com sucesso!',
      count: encontrosEstaticos.length 
    })
  } catch (error) {
    console.error('Erro ao inicializar dados:', error)
    return NextResponse.json({ 
      error: 'Erro ao inicializar dados'
    }, { status: 500 })
  }
}
