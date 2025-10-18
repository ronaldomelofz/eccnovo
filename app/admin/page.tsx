'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Encontro = {
  ano: number
  mes: string
  dia: string
  anfitriao: string
  descricao: string
  foto?: string
  semFoto?: boolean
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const CASAIS: string[] = [
  'ROBERVAL E IARA',
  'JOÃO MAURICIO E FERNANDA',
  'RIBINHA E ROSANA',
  'RAULINO E NAIR',
  'RUBENS E FERNANDA',
  'RONALD E SARA',
  'HUGO E YANE',
  'RONALDO E SANDRA',
  'MARCIO E FERNANDA',
  'MAURO E DALIANE',
]

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [ano, setAno] = useState<number>(2025)
  const [mes, setMes] = useState<string>('Janeiro')
  const [dia, setDia] = useState<string>('01')
  const [anfitriao, setAnfitriao] = useState<string>(CASAIS[0])
  const [descricao, setDescricao] = useState<string>('')
  const [foto, setFoto] = useState<string>('')
  const [semFoto, setSemFoto] = useState<boolean>(false)

  const [itens, setItens] = useState<Encontro[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Carregar encontros da API
  const carregarEncontros = async () => {
    try {
      const response = await fetch('/api/encontros')
      if (response.ok) {
        const encontros = await response.json()
        setItens(encontros)
      }
    } catch (error) {
      console.error('Erro ao carregar encontros:', error)
    }
  }

  useEffect(() => {
    if (authorized) {
      carregarEncontros()
    }
  }, [authorized])

  const salvar = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/encontros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ano,
          mes,
          dia,
          anfitriao,
          descricao,
          foto,
          semFoto
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Recarregar lista de encontros
        await carregarEncontros()
        
        // Reset parcial mantendo ano/mes
        setDia('01')
        setAnfitriao(CASAIS[0])
        setDescricao('')
        setFoto('')
        setSemFoto(false)
        
        alert('Encontro salvo com sucesso! Os dados foram atualizados automaticamente.')
      } else {
        const error = await response.json()
        alert(`Erro ao salvar: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao salvar encontro:', error)
      alert('Erro ao salvar encontro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const remover = async (idx: number) => {
    if (loading) return
    
    if (!confirm('Tem certeza que deseja remover este encontro?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/encontros?index=${idx}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Recarregar lista de encontros
        await carregarEncontros()
        alert('Encontro removido com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao remover: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao remover encontro:', error)
      alert('Erro ao remover encontro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const ordenados = useMemo(() => {
    const mesesIdx: Record<string, number> = MESES.reduce((acc, m, i) => { acc[m] = i + 1; return acc }, {} as Record<string, number>)
    return [...itens].sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano
      const ma = mesesIdx[a.mes] || 0
      const mb = mesesIdx[b.mes] || 0
      if (ma !== mb) return ma - mb
      return parseInt(a.dia) - parseInt(b.dia)
    })
  }, [itens])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-center">Administração</h1>
          <label className="block text-sm text-gray-300 mb-2">Senha</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="mt-4 w-full bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              if (password === 'amoragape') setAuthorized(true)
              else alert('Senha incorreta')
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Administração de Encontros</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Ano</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value || '0', 10))}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Mês</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            >
              {MESES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Dia</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              min={1}
              max={31}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Casal Anfitrião</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              value={anfitriao}
              onChange={(e) => setAnfitriao(e.target.value)}
            >
              {CASAIS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Descrição</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              placeholder="Ex.: 18º ENCONTRO 2º TEMÁRIO"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">URL da Foto (opcional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              placeholder="/FOTOS/ENCONTRO-XX-DD-MM-AAAA.jpeg"
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
              disabled={semFoto}
            />
            <div className="mt-2 flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                disabled={semFoto}
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const dataUrl = String(reader.result || '')
                    setFoto(dataUrl)
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <button
                type="button"
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-1 px-3 rounded-lg border border-gray-600"
                disabled={!foto || semFoto}
                onClick={() => {
                  setFoto('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Limpar
              </button>
              <span className="text-xs text-gray-400">Selecionando um arquivo, o campo será preenchido automaticamente.</span>
            </div>

            {/* Pré-visualização da imagem selecionada */}
            {!semFoto && foto && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">Pré-visualização:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="Pré-visualização" className="max-h-40 rounded-md border border-gray-600" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="semfoto"
              type="checkbox"
              className="h-4 w-4"
              checked={semFoto}
              onChange={(e) => setSemFoto(e.target.checked)}
            />
            <label htmlFor="semfoto" className="text-sm text-gray-300">Sem foto</label>
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg"
              onClick={salvar}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Encontro'}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Encontros salvos</h2>
          {ordenados.length === 0 ? (
            <p className="text-gray-400">Nenhum encontro salvo ainda.</p>
          ) : (
            <ul className="space-y-2">
              {ordenados.map((e, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-200">{e.dia} de {e.mes} de {e.ano} — {e.anfitriao} — {e.descricao} {e.semFoto ? '(SEM FOTO)' : e.foto ? '' : ''}</span>
                  <button 
                    className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed" 
                    onClick={() => remover(idx)}
                    disabled={loading}
                  >
                    {loading ? 'Removendo...' : 'Remover'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}


