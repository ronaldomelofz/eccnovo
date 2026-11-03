'use client'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { encontros, type Encontro } from './data/encontros'
import { sortEncontrosAsc, sortEncontrosDesc } from './data/ordenar'
import { calcularRodadaAtual } from './data/rodada'

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState('')
  const [currentCaption, setCurrentCaption] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [allImages, setAllImages] = useState<{src: string, caption: string, data: string, numero: string, anfitriao: string}[]>([])
  const [currentEncontroInfo, setCurrentEncontroInfo] = useState<{data: string, numero: string, anfitriao: string} | null>(null)
  const [allEncontros] = useState(encontros)
  const [activeTab, setActiveTab] = useState<'ordem' | number | null>(null)

  // Criar lista de todas as imagens disponíveis
  const getAllImages = () => {
    const images: {src: string, caption: string, data: string, numero: string, anfitriao: string}[] = []
    
    // Organizar encontros por ano (2025, 2024, 2023) e dentro de cada ano do mais recente para o mais antigo
    const encontrosOrdenados = sortEncontrosAsc(allEncontros)
    
    encontrosOrdenados.forEach(encontro => {
      if (!encontro.semFoto && encontro.foto) {
        images.push({
          src: encontro.foto,
          caption: `Encontro ${encontro.dia} de ${encontro.mes} de ${encontro.ano}`,
          data: `${encontro.dia} de ${encontro.mes} de ${encontro.ano}`,
          numero: encontro.descricao,
          anfitriao: encontro.anfitriao
        })
      }
    })
    return images
  }

  const openModal = (imageSrc: string, caption: string) => {
    const images = getAllImages()
    const index = images.findIndex(img => img.src === imageSrc)
    setAllImages(images)
    setCurrentImageIndex(index)
    setCurrentImage(imageSrc)
    setCurrentCaption(caption)
    setCurrentEncontroInfo({
      data: images[index].data,
      numero: images[index].numero,
      anfitriao: images[index].anfitriao
    })
    setModalOpen(true)
  }

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setCurrentImage('')
    setCurrentCaption('')
    setCurrentImageIndex(0)
    setAllImages([])
  }, [])

  const goToPrevious = useCallback(() => {
    if (allImages.length > 0) {
      const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1
      setCurrentImageIndex(newIndex)
      setCurrentImage(allImages[newIndex].src)
      setCurrentCaption(allImages[newIndex].caption)
      setCurrentEncontroInfo({
        data: allImages[newIndex].data,
        numero: allImages[newIndex].numero,
        anfitriao: allImages[newIndex].anfitriao
      })
    }
  }, [allImages, currentImageIndex])

  const goToNext = useCallback(() => {
    if (allImages.length > 0) {
      const newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0
      setCurrentImageIndex(newIndex)
      setCurrentImage(allImages[newIndex].src)
      setCurrentCaption(allImages[newIndex].caption)
      setCurrentEncontroInfo({
        data: allImages[newIndex].data,
        numero: allImages[newIndex].numero,
        anfitriao: allImages[newIndex].anfitriao
      })
    }
  }, [allImages, currentImageIndex])

  // Adicionar event listener para teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) {
        if (e.key === 'ArrowLeft') {
          goToPrevious()
        } else if (e.key === 'ArrowRight') {
          goToNext()
        } else if (e.key === 'Escape') {
          closeModal()
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen, currentImageIndex, allImages, goToPrevious, goToNext, closeModal])

  // Organizar encontros por ano dinamicamente
  const anos = Array.from(new Set(allEncontros.map(e => e.ano))).sort((a, b) => b - a)

  const encontrosPorAno = anos.reduce<Record<number, Encontro[]>>((acc, ano) => {
    acc[ano] = sortEncontrosDesc(allEncontros.filter(e => e.ano === ano))
    return acc
  }, {})

  const tabAtiva = activeTab ?? anos[0] ?? 'ordem'
  const rodada = calcularRodadaAtual(allEncontros)

  useEffect(() => {
    if (activeTab === null && anos.length > 0) {
      setActiveTab(anos[0])
    }
  }, [anos, activeTab])

  const renderEncontroCard = (encontro: Encontro, index: number) => (
    <div key={`${encontro.ano}-${encontro.mes}-${encontro.dia}-${index}`} className="bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-500 rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="hidden md:flex items-center justify-between">
        <div className="encontro-info flex-1">
          <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-pink-300">Encontro de {encontro.mes}</h3>
          <p className="mb-2 text-gray-200"><strong>Data:</strong> {encontro.dia} de {encontro.mes} de {encontro.ano}</p>
          <p className="text-gray-200"><strong>Casal Anfitrião:</strong> {encontro.anfitriao}</p>
          <p className="text-gray-200"><strong>Descrição:</strong> {encontro.descricao}</p>
          {encontro.observacao ? (
            <p className="text-amber-200 mt-2"><strong>Observação:</strong> {encontro.observacao}</p>
          ) : null}
        </div>
        <div className="encontro-foto ml-8 flex-shrink-0">
          {encontro.semFoto ? (
            <div className="w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-600">
              <p className="text-gray-400 italic text-center text-sm">SEM FOTO</p>
            </div>
          ) : (
            <Image
              src={encontro.foto || ''}
              alt={`Encontro ${encontro.dia} de ${encontro.mes} de ${encontro.ano}`}
              width={128}
              height={96}
              className="rounded-lg cursor-pointer hover:opacity-80 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => openModal(encontro.foto || '', `Encontro ${encontro.dia} de ${encontro.mes} de ${encontro.ano}`)}
            />
          )}
        </div>
      </div>
      <div className="md:hidden">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold mb-2 text-pink-300">Encontro de {encontro.mes}</h3>
          <p className="mb-1 text-gray-200 text-sm"><strong>Data:</strong> {encontro.dia} de {encontro.mes} de {encontro.ano}</p>
          <p className="text-gray-200 text-sm"><strong>Casal Anfitrião:</strong> {encontro.anfitriao}</p>
          <p className="text-gray-200 text-sm"><strong>Descrição:</strong> {encontro.descricao}</p>
          {encontro.observacao ? (
            <p className="text-amber-200 text-sm mt-2"><strong>Observação:</strong> {encontro.observacao}</p>
          ) : null}
        </div>
        <div className="flex justify-center">
          {encontro.semFoto ? (
            <div className="w-40 h-30 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-600">
              <p className="text-gray-400 italic text-center text-sm">SEM FOTO</p>
            </div>
          ) : (
            <Image
              src={encontro.foto || ''}
              alt={`Encontro ${encontro.dia} de ${encontro.mes} de ${encontro.ano}`}
              width={160}
              height={120}
              className="rounded-lg cursor-pointer hover:opacity-80 transition-all duration-300 shadow-md"
              onClick={() => openModal(encontro.foto || '', `Encontro ${encontro.dia} de ${encontro.mes} de ${encontro.ano}`)}
            />
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-xl">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between gap-8">
              {/* Logo à esquerda */}
              <div className="flex-shrink-0">
                <Image
                  src="/FOTOS/logo.jpeg"
                  alt="Logo ECC ALIMENTO DO AMOR"
                  width={120}
                  height={160}
                  className="rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
              </div>
              
              {/* Centro - Título e informações */}
              <div className="flex-1 text-center px-4">
                <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 tracking-wide">
                  ECC ALIMENTO DO AMOR
                </h1>
                
                {/* Informações centralizadas abaixo do título */}
                <div className="bg-gray-800 text-white rounded-xl p-4 border-2 border-gray-600 inline-block shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <p className="text-lg xl:text-xl text-gray-200 font-medium">
                    57º / 2023 - 28, 29 e 30 de Abril de 2023
                  </p>
                </div>
              </div>
              
              {/* Coluna direita - Player */}
              <div className="flex-shrink-0 flex flex-col items-end gap-4">
                <audio controls className="w-64 xl:w-72 h-12 rounded-lg shadow-lg">
                  <source src="/FOTOS/Algo Em Comum.mp3" type="audio/mpeg" />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          <div className="container mx-auto px-4 py-6">
            {/* Logo e Título */}
            <div className="flex flex-col items-center text-center mb-6">
              <Image
                src="/FOTOS/logo.jpeg"
                alt="Logo ECC ALIMENTO DO AMOR"
                width={100}
                height={133}
                className="rounded-lg shadow-lg mb-4"
              />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                ECC ALIMENTO DO AMOR
              </h1>
              
              {/* Informações */}
              <div className="bg-gray-800 text-white rounded-xl p-4 border-2 border-gray-600 shadow-lg w-full max-w-sm">
                <p className="text-base sm:text-lg text-gray-200 font-medium">
                  57º / 2023 - 28, 29 e 30 de Abril de 2023
                </p>
              </div>

              {/* Player de música centralizado */}
              <div className="text-center mt-4">
                <audio controls className="w-full max-w-sm h-12 rounded-lg shadow-lg">
                  <source src="/FOTOS/Algo Em Comum.mp3" type="audio/mpeg" />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <section>
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8 text-white">ENCONTROS</h2>

          {/* Abas: ordem dos casais + anos */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveTab('ordem')}
              className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 border-2 ${
                tabAtiva === 'ordem'
                  ? 'bg-amber-600 border-amber-400 text-white shadow-lg scale-105'
                  : 'bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600 hover:border-gray-400'
              }`}
            >
              Ordem dos Casais
            </button>
            {anos.map(ano => (
              <button
                key={ano}
                onClick={() => setActiveTab(ano)}
                className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 border-2 ${
                  tabAtiva === ano
                    ? 'bg-pink-600 border-pink-400 text-white shadow-lg scale-105'
                    : 'bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600 hover:border-gray-400'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>

          {tabAtiva === 'ordem' ? (
            <div className="mb-16 max-w-5xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-semibold mb-2 text-white text-center">
                {rodada.novaRodada ? 'Nova rodada iniciada' : rodada.nomeRodada}
              </h3>
              <p className="text-center text-gray-400 mb-6">
                Encontros {rodada.numeroInicioCiclo} a {rodada.numeroFimCiclo}
                {rodada.novaRodada ? ' · todos os casais estão aptos' : ' · em andamento'}
              </p>

              {rodada.novaRodada ? (
                <div className="grid gap-3">
                  {rodada.statusCasais.map((item, index) => (
                    <div
                      key={item.casal}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 ${
                        index === 0
                          ? 'bg-pink-950/50 border-pink-400'
                          : 'bg-sky-950/30 border-sky-600/70'
                      }`}
                    >
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 border border-gray-500 flex items-center justify-center font-bold">
                        {item.ordem}
                      </span>
                      <div>
                        <p className="font-semibold text-lg">{item.casal}</p>
                        <p className={`text-sm ${index === 0 ? 'text-pink-200' : 'text-sky-200'}`}>
                          {index === 0 ? 'Próximo encontro' : 'Apto para a nova rodada'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-600 bg-gray-700/70 p-5 mb-6">
                    <div className="flex items-end justify-between gap-4 mb-3">
                      <p className="text-amber-300 text-2xl font-bold">
                        {rodada.completos} de {rodada.totalCasais}
                      </p>
                      <p className="text-gray-300 text-sm">casais já foram anfitriões</p>
                    </div>
                    <div className="h-3 rounded-full bg-gray-900 overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${rodada.totalCasais ? Math.round((rodada.completos / rodada.totalCasais) * 100) : 0}%` }}
                      />
                    </div>
                    {rodada.repetidos.length > 0 && (
                      <p className="text-amber-200 text-sm mt-3">
                        Mais de uma hospedagem:{' '}
                        {rodada.repetidos.map((r) => `${r.casal} (${r.quantidade})`).join(' · ')}
                      </p>
                    )}
                    {rodada.foraDaOrdem.length > 0 && (
                      <p className="text-amber-200 text-sm mt-2">
                        Fora da ordem oficial: {rodada.foraDaOrdem.join(' · ')}
                      </p>
                    )}
                  </div>

                  {rodada.proximosNaOrdem[0] && (
                    <div className="rounded-2xl border-2 border-pink-400 bg-pink-950/40 p-5 mb-6 text-center">
                      <p className="text-pink-200 text-sm font-semibold uppercase tracking-wide">Próximo encontro</p>
                      <p className="text-2xl lg:text-3xl font-bold mt-1">{rodada.proximosNaOrdem[0].casal}</p>
                      <p className="text-pink-100 mt-1">{rodada.proximosNaOrdem[0].ordem}º na ordem oficial</p>
                    </div>
                  )}

                  <div className="grid lg:grid-cols-2 gap-6">
                    <section>
                      <h4 className="text-lg font-semibold text-red-200 mb-3">
                        Ainda faltam ({rodada.pendentes.length})
                      </h4>
                      <div className="grid gap-3">
                        {rodada.pendentes.map((item) => (
                          <div key={item.casal} className="flex items-center gap-3 rounded-xl border-2 border-red-500/80 bg-red-950/40 p-4">
                            <span className="w-9 h-9 rounded-full bg-red-600 text-white font-bold flex items-center justify-center">
                              {item.ordem}
                            </span>
                            <div>
                              <p className="font-semibold">{item.casal}</p>
                              <p className="text-sm text-red-200">
                                {item.casal === rodada.proximosNaOrdem[0]?.casal ? 'Próximo da ordem' : 'Aguardando a vez'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-lg font-semibold text-green-200 mb-3">
                        Já receberam ({rodada.completos})
                      </h4>
                      <div className="grid gap-3">
                        {rodada.statusCasais
                          .filter((item) => item.jaFoiAnfitriao)
                          .sort((a, b) => (b.numeroEncontro || 0) - (a.numeroEncontro || 0))
                          .map((item) => (
                            <div key={item.casal} className="flex items-center gap-3 rounded-xl border border-green-700/70 bg-gray-700/80 p-4">
                              <span className="w-9 h-9 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">
                                {item.ordem}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold">{item.casal}</p>
                                <p className="text-sm text-gray-300 truncate">
                                  {item.numeroEncontro ? `${item.numeroEncontro}º encontro · ` : ''}
                                  {item.descricaoUltimoEncontro} — {item.dataUltimoEncontro}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </section>
                  </div>

                  {rodada.encontrosNaRodada.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-300 mb-3">
                        Encontros desta rodada
                      </h4>
                      <div className="grid gap-2">
                        {sortEncontrosDesc(rodada.encontrosNaRodada).map((encontro) => (
                          <div
                            key={encontro.numero}
                            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-gray-600 bg-gray-800/80 px-4 py-3"
                          >
                            <span className="text-amber-300 font-bold w-10">{encontro.numero}º</span>
                            <span className="text-white font-medium">{encontro.anfitriao}</span>
                            <span className="text-gray-400 text-sm">
                              {encontro.dia} de {encontro.mes} de {encontro.ano}
                            </span>
                            <span className="text-pink-300 text-sm">{encontro.descricao}</span>
                            {encontro.observacao ? (
                              <span className="text-amber-200 text-sm">· {encontro.observacao}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mb-16">
              <h3 className="text-2xl lg:text-3xl font-semibold mb-8 text-gray-300 border-b-2 border-gray-600 pb-3">
                Agenda {tabAtiva}
              </h3>
              <div className="grid gap-6 lg:gap-8">
                {(encontrosPorAno[tabAtiva as number] || []).length > 0 ? (
                  (encontrosPorAno[tabAtiva as number] || []).map(renderEncontroCard)
                ) : (
                  <p className="text-center text-gray-400 py-8">Nenhum encontro registrado para {tabAtiva}.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 py-8 lg:py-12">
        <div className="container mx-auto px-4 lg:px-6 text-center">
          <div className="text-gray-300 space-y-2">
            <p className="text-base lg:text-lg">© 2023-2026 ECC Alimento do Amor</p>
            <p className="text-sm lg:text-base">Encontros de Casais com Cristo</p>
          </div>
        </div>
      </footer>

      {/* Modal para ampliar fotos */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50" onClick={closeModal}>
          
          <div className="flex justify-between items-center p-4 bg-gray-900 bg-opacity-75 lg:hidden">
            <div className="flex-1 text-center">
              <h3 className="text-white text-lg font-semibold">{currentCaption}</h3>
              {currentEncontroInfo && (
                <div className="mt-2 space-y-1">
                  <p className="text-gray-300 text-sm font-medium">{currentEncontroInfo.data}</p>
                  <p className="text-amber-300 text-sm font-semibold">
                    Casal Anfitrião: {currentEncontroInfo.anfitriao}
                  </p>
                  <p className="text-pink-300 text-sm font-semibold">{currentEncontroInfo.numero}</p>
                </div>
              )}
            </div>
            <button
              className="text-white text-3xl font-bold hover:text-red-400 transition-colors duration-200 bg-red-600 bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl"
              onClick={(e) => { e.stopPropagation(); closeModal(); }}
              title="Fechar (ESC)"
            >
              ✕
            </button>
          </div>

          
          <div className="hidden lg:block absolute top-0 left-0 right-0 z-20 p-6 bg-gray-900 bg-opacity-90">
            <div className="text-center">
              <h3 className="text-white text-xl font-semibold mb-2">{currentCaption}</h3>
              {currentEncontroInfo && (
                <div className="space-y-1">
                  <p className="text-gray-300 text-base font-medium">{currentEncontroInfo.data}</p>
                  <p className="text-amber-300 text-base font-semibold">
                    Casal Anfitrião: {currentEncontroInfo.anfitriao}
                  </p>
                  <p className="text-pink-300 text-base font-semibold">{currentEncontroInfo.numero}</p>
                </div>
              )}
            </div>
          </div>

          
          <div className="flex-1 flex items-center justify-center relative p-4 lg:p-8 pt-20 lg:pt-24">
            
            <button
              className="hidden lg:block absolute top-4 right-4 text-white text-3xl font-bold z-30 hover:text-red-400 transition-colors duration-200 bg-red-600 bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl"
              onClick={(e) => { e.stopPropagation(); closeModal(); }}
              title="Fechar (ESC)"
            >
              &times;
            </button>

            {/* Seta Esquerda - Desktop */}
            {allImages.length > 1 && (
              <button
                className="hidden lg:block absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-5xl font-bold z-10 hover:text-white transition-all duration-300 bg-gray-800 bg-opacity-30 rounded-full w-14 h-14 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                title="Anterior (←)"
              >
                &lsaquo;
              </button>
            )}

            {/* Imagem */}
            <div className="relative w-full max-w-5xl h-[60vh] lg:h-[70vh] flex items-center justify-center">
              <Image
                src={currentImage}
                alt={currentEncontroInfo ? `${currentCaption} — ${currentEncontroInfo.anfitriao}` : currentCaption}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Seta Direita - Desktop */}
            {allImages.length > 1 && (
              <button
                className="hidden lg:block absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-5xl font-bold z-10 hover:text-white transition-all duration-300 bg-gray-800 bg-opacity-30 rounded-full w-14 h-14 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                title="Próxima (→)"
              >
                &rsaquo;
              </button>
            )}
          </div>

          
          <div className="flex justify-between items-center p-4 bg-gray-900 bg-opacity-75 lg:hidden">
            {allImages.length > 1 && (
              <button
                className="text-gray-400 text-4xl font-bold hover:text-white transition-all duration-300 bg-gray-800 bg-opacity-30 rounded-full w-14 h-14 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                title="Anterior (←)"
              >
                &lsaquo;
              </button>
            )}
            <div className="flex-1 text-center">
              <h3 className="text-white text-lg font-semibold hidden"></h3> {}
            </div>
            {allImages.length > 1 && (
              <button
                className="text-gray-400 text-4xl font-bold hover:text-white transition-all duration-300 bg-gray-800 bg-opacity-30 rounded-full w-14 h-14 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                title="Próxima (→)"
              >
                &rsaquo;
              </button>
            )}
          </div>

          {}
        </div>
      )}
    </div>
  )
}





























