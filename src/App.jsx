import { useEffect, useMemo, useState } from 'react';

export default function ControleServicosLBP() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const [clientesHistorico, setClientesHistorico] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const clientesSalvos = localStorage.getItem('lbp_clientes');

    return clientesSalvos ? JSON.parse(clientesSalvos) : [];
  });

  const [servicos, setServicos] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const dadosSalvos = localStorage.getItem('lbp_servicos');

    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
  });

  const [novoServico, setNovoServico] = useState({
    cliente: '',
    telefone: '',
    produto: '',
    status: 'Produção',
    valor: '',
    recebido: '',
    restante: '',
    prazo: ''
  });

  const statusColor = {
    Produção: 'bg-blue-100 text-blue-700',
    Finalizado: 'bg-green-100 text-green-700',
    Aguardando: 'bg-orange-100 text-orange-700'
  };

  

  useEffect(() => {
    localStorage.setItem(
      'lbp_clientes',
      JSON.stringify(clientesHistorico)
    );
  }, [clientesHistorico]);

  useEffect(() => {
    localStorage.setItem('lbp_servicos', JSON.stringify(servicos));
  }, [servicos]);

  function formatarTelefone(valor) {
    const numero = valor.replace(/\D/g, '').slice(0, 11);

    if (numero.length <= 2) {
      return `(${numero}`;
    }

    if (numero.length <= 7) {
      return `(${numero.slice(0, 2)}) ${numero.slice(2)}`;
    }

    return `(${numero.slice(0, 2)}) ${numero.slice(2, 3)} ${numero.slice(3, 7)}-${numero.slice(7, 11)}`;
  }

  function formatarMoedaDigitando(valor) {
    const texto = valor.replace(/[^\d,]/g, '');

    if (!texto) {
      return '';
    }

    const partes = texto.split(',');

    const inteiro = partes[0]
      ? Number(partes[0]).toLocaleString('pt-BR')
      : '0';

    if (partes.length === 1) {
      return inteiro;
    }

    return `${inteiro},${partes[1].slice(0, 2)}`;
  }

  function formatarMoeda(valor) {
    const texto = String(valor)
      .replace(/R\$/g, '')
      .replace(/\./g, '')
      .trim();

    if (!texto) {
      return '';
    }

    let numero = 0;

    if (texto.includes(',')) {
      const [inteiro, decimal = ''] = texto.split(',');

      numero = Number(`${inteiro}.${decimal.padEnd(2, '0').slice(0, 2)}`);
    } else {
      numero = Number(texto);
    }

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function converterMoedaParaNumero(valor) {
    return (
      Number(
        String(valor)
          .replace(/R\$/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0
    );
  }

  function calcularRestanteAutomatico(total, recebido) {
    const valorTotal = converterMoedaParaNumero(total);
    const valorRecebido = converterMoedaParaNumero(recebido);

    const restante = Math.max(valorTotal - valorRecebido, 0);

    return restante.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatarData(data) {
    if (!data) {
      return '-';
    }

    const partes = data.split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function atualizarCampo(campo, valor) {
    setNovoServico((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor
    }));
  }

  function editarServico(index) {
    const servico = servicos[index];

    setNovoServico({
      cliente: servico.cliente,
      telefone: servico.telefone,
      produto: servico.produto,
      status: servico.status,
      valor: servico.valor,
      recebido: '',
      restante: servico.restante,
      prazo: servico.prazo
    });

    setEditandoIndex(index);
    setMostrarFormulario(true);
  }

  function marcarEntregue(index) {
    setServicos((listaAtual) =>
      listaAtual.map((item, i) =>
        i === index
          ? {
              ...item,
              status: 'Finalizado'
            }
          : item
      )
    );
  }

  function baixarRelatorioPDF() {
    const conteudoRelatorio = document.getElementById('area-relatorio');

    if (!conteudoRelatorio) {
      alert('Relatório não encontrado.');
      return;
    }

    const conteudoHTML = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Relatório Laser Brindes Palmas</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #111;
              background: white;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #111;
              color: white;
            }
          </style>
        </head>

        <body>
          ${conteudoRelatorio.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([conteudoHTML], {
      type: 'text/html;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = `relatorio-lbp-${new Date()
      .toLocaleDateString('pt-BR')
      .replace(/\//g, '-')}.html`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function imprimirRelatorio() {
    const conteudoRelatorio = document.getElementById('area-relatorio');

    if (!conteudoRelatorio) {
      alert('Relatório não encontrado.');
      return;
    }

    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const documento = iframe.contentWindow?.document;

    if (!documento) {
      alert('Erro ao iniciar impressão.');
      return;
    }

    documento.open();

    documento.write(`
      <html>
        <head>
          <title>Relatório - Laser Brindes Palmas</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #111;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #111;
              color: white;
            }

            h1, h2, h3 {
              margin: 0;
            }
          </style>
        </head>

        <body>
          ${conteudoRelatorio.innerHTML}
        </body>
      </html>
    `);

    documento.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }

  function adicionarServico() {
    if (!novoServico.cliente.trim()) {
      alert('Digite o nome do cliente.');
      return;
    }

    if (!novoServico.produto) {
      alert('Selecione um produto.');
      return;
    }

    const clienteExiste = clientesHistorico.some(
      (nome) =>
        nome.toLowerCase() === novoServico.cliente.toLowerCase()
    );

    if (!clienteExiste) {
      const novaLista = [...clientesHistorico, novoServico.cliente];

      setClientesHistorico(novaLista);

      localStorage.setItem(
        'lbp_clientes',
        JSON.stringify(novaLista)
      );
    }

    const restanteCalculado = calcularRestanteAutomatico(
      novoServico.valor,
      novoServico.recebido || 'R$ 0,00'
    );

    const novoItem = {
      cliente: novoServico.cliente,
      telefone: novoServico.telefone || '-',
      produto: novoServico.produto,
      status: novoServico.status,
      valor: novoServico.valor || 'R$ 0,00',
      restante: restanteCalculado,
      prazo: novoServico.prazo
    };

    if (editandoIndex !== null) {
      setServicos((listaAtual) =>
        listaAtual.map((item, index) =>
          index === editandoIndex ? novoItem : item
        )
      );

      setEditandoIndex(null);
    } else {
      setServicos((listaAtual) => [novoItem, ...listaAtual]);
    }

    setNovoServico({
      cliente: '',
      telefone: '',
      produto: '',
      status: 'Produção',
      valor: '',
      recebido: '',
      restante: '',
      prazo: ''
    });

    alert('Serviço salvo com sucesso!');
  }

  const servicosFiltrados = useMemo(() => {
    return servicos.filter((item) => {
      const texto = `${item.cliente} ${item.produto}`.toLowerCase();

      const passouBusca = texto.includes(busca.toLowerCase());

      const passouFiltro =
        filtroStatus === 'Todos' ||
        (filtroStatus === 'Produção'
          ? item.status !== 'Finalizado'
          : item.status === filtroStatus);

      return passouBusca && passouFiltro;
    });
  }, [servicos, busca, filtroStatus]);

  const totalRecebido = useMemo(() => {
    const total = servicos.reduce((acc, item) => {
      const valor = converterMoedaParaNumero(item.valor);
      const restante = converterMoedaParaNumero(item.restante);

      return acc + (valor - restante);
    }, 0);

    return total.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }, [servicos]);

  const totalVendido = useMemo(() => {
    const total = servicos.reduce((acc, item) => {
      return acc + converterMoedaParaNumero(item.valor);
    }, 0);

    return total.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }, [servicos]);

  const totalFaltaReceber = useMemo(() => {
    const total = servicos.reduce((acc, item) => {
      return acc + converterMoedaParaNumero(item.restante);
    }, 0);

    return total.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }, [servicos]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-6 md:p-8 shadow-2xl flex-1">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border border-amber-300/40 flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-amber-950 shadow-[0_0_60px_rgba(251,191,36,0.35)] overflow-hidden">
                  <span
                    className="relative text-6xl md:text-8xl font-black italic leading-none text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-700"
                    style={{ fontFamily: 'serif' }}
                  >
                    L
                  </span>
                </div>

                <div className="flex flex-col">
                  <h1
                    className="text-5xl md:text-7xl font-black uppercase leading-none tracking-[0.08em] text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600"
                    style={{ fontFamily: 'serif' }}
                  >
                    LASER
                  </h1>

                  <p className="text-xl md:text-3xl tracking-[0.35em] uppercase text-amber-200 font-light mt-1">
                    BRINDES PALMAS
                  </p>

                  <p className="text-amber-200/70 mt-4 text-xs md:text-sm tracking-[0.4em] uppercase">
                    Controle Premium de Produção e Serviços
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-amber-400 pl-4 py-1 max-w-4xl">
                <p className="text-zinc-300 text-sm md:text-lg italic leading-relaxed">
                  “Descanse tranquilo, a Laser Brindes Palmas não veio para ser só mais uma… veio para ser referência.”
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="relative overflow-hidden border border-amber-300/30 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 hover:brightness-110 transition px-6 py-4 rounded-3xl text-black font-black shadow-[0_0_30px_rgba(251,191,36,0.35)] uppercase tracking-wide"
          >
            {mostrarFormulario ? 'Fechar Formulário' : '+ Novo Serviço'}
          </button>
        </div>

        {mostrarFormulario && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl grid md:grid-cols-2 gap-4">
            <div>
              <input
                list="clientes-salvos"
                placeholder="Nome do Cliente"
                value={novoServico.cliente}
                onChange={(e) => atualizarCampo('cliente', e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 outline-none"
              />

              <datalist id="clientes-salvos">
                {clientesHistorico.map((cliente, index) => (
                  <option key={index} value={cliente} />
                ))}
              </datalist>
            </div>

            <input
              placeholder="(63) 9 9999-9999"
              value={novoServico.telefone}
              onChange={(e) =>
                atualizarCampo('telefone', formatarTelefone(e.target.value))
              }
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <select
              value={novoServico.produto}
              onChange={(e) => atualizarCampo('produto', e.target.value)}
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none text-white"
            >
              <option value="">Selecionar Produto</option>
              <option>Gravação Copo Stanley</option>
              <option>Plaquinha Decorativa</option>
              <option>Chaveiro Personalizado</option>
              <option>Kit Premium</option>
              <option>Taça Personalizada</option>
            </select>

            <select
              value={novoServico.status}
              onChange={(e) => atualizarCampo('status', e.target.value)}
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none text-white"
            >
              <option>Produção</option>
              <option>Aguardando</option>
              <option>Finalizado</option>
            </select>

            <input
              placeholder="Valor Total"
              value={novoServico.valor}
              onChange={(e) =>
                atualizarCampo(
                  'valor',
                  formatarMoedaDigitando(e.target.value)
                )
              }
              onBlur={(e) =>
                atualizarCampo('valor', formatarMoeda(e.target.value))
              }
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <input
              placeholder="Valor Recebido"
              value={novoServico.recebido}
              onChange={(e) =>
                atualizarCampo(
                  'recebido',
                  formatarMoedaDigitando(e.target.value)
                )
              }
              onBlur={(e) =>
                atualizarCampo('recebido', formatarMoeda(e.target.value))
              }
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400 px-1 block mb-2">
                Data prevista para entrega do produto
              </label>

              <input
                type="date"
                value={novoServico.prazo}
                onChange={(e) => atualizarCampo('prazo', e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 outline-none text-white"
              />
            </div>

            <button
              type="button"
              onClick={adicionarServico}
              className="md:col-span-2 bg-amber-500 hover:bg-amber-400 transition rounded-2xl py-4 text-black font-bold"
            >
              {editandoIndex !== null
                ? 'Atualizar Serviço'
                : 'Salvar Serviço'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-sm">Entradas</p>
              <span className="text-2xl">📦</span>
            </div>
            <h2 className="text-3xl font-bold mt-2">{servicos.length}</h2>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-sm">Em Produção</p>
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-bold mt-2 text-blue-400">
              {servicos.filter((item) => item.status !== 'Finalizado').length}
            </h2>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-sm">Falta Receber</p>
              <span className="text-2xl">💰</span>
            </div>
            <h2 className="text-3xl font-bold mt-2 text-amber-300">
              {totalFaltaReceber}
            </h2>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-sm">Pedidos Entregues</p>
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-3xl font-bold mt-2 text-green-400">
              {servicos.filter((item) => item.status === 'Finalizado').length}
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-950 to-zinc-900 border border-green-500/20 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-green-300">
                Total Recebido
              </h3>
              <span className="text-3xl">💵</span>
            </div>

            <p className="text-4xl font-black text-white">
              {totalRecebido}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-950 to-zinc-900 border border-amber-500/20 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-amber-300">
                Total Vendido
              </h3>
              <span className="text-3xl">📈</span>
            </div>

            <p className="text-4xl font-black text-white">
              {totalVendido}
            </p>
          </div>
        </div>

        {mostrarRelatorio && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black uppercase">
                    Relatório Diário
                  </h2>

                  <p className="font-medium mt-1">
                    Laser Brindes Palmas
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={baixarRelatorioPDF}
                    className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    📄 Salvar Relatório
                  </button>

                  <button
                    onClick={imprimirRelatorio}
                    className="bg-black text-white px-5 py-3 rounded-2xl font-black"
                  >
                    🖨️ Imprimir
                  </button>

                  <button
                    onClick={() => setMostrarRelatorio(false)}
                    className="bg-white text-black px-5 py-3 rounded-2xl font-black"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div id="area-relatorio" className="p-8 space-y-6">
                <div>
                  <h1 className="text-4xl font-black text-amber-700">
                    Laser Brindes Palmas
                  </h1>

                  <p className="mt-3 italic text-zinc-700">
                    “Descanse tranquilo, a Laser Brindes Palmas não veio para ser só mais uma, veio para ser referência.”
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-zinc-100 rounded-2xl p-5">
                    <p className="text-sm text-zinc-500">Total Vendido</p>
                    <h3 className="text-3xl font-black mt-2">{totalVendido}</h3>
                  </div>

                  <div className="bg-zinc-100 rounded-2xl p-5">
                    <p className="text-sm text-zinc-500">Total Recebido</p>
                    <h3 className="text-3xl font-black mt-2">{totalRecebido}</h3>
                  </div>

                  <div className="bg-zinc-100 rounded-2xl p-5">
                    <p className="text-sm text-zinc-500">Falta Receber</p>
                    <h3 className="text-3xl font-black mt-2">{totalFaltaReceber}</h3>
                  </div>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="p-3 text-left">Cliente</th>
                      <th className="p-3 text-left">Produto</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Valor</th>
                      <th className="p-3 text-left">Falta</th>
                      <th className="p-3 text-left">Prazo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {servicosFiltrados.map((item, index) => (
                      <tr key={index} className="border-b border-zinc-300">
                        <td className="p-3">{item.cliente}</td>
                        <td className="p-3">{item.produto}</td>
                        <td className="p-3">{item.status}</td>
                        <td className="p-3">{item.valor}</td>
                        <td className="p-3">{item.restante}</td>
                        <td className="p-3">{formatarData(item.prazo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl overflow-x-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">Serviços Ativos</h2>

              <button
                onClick={() => setMostrarRelatorio(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-black shadow-lg"
              >
                🖨️ Relatório do Dia
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none"
              >
                <option>Todos</option>
                <option>Produção</option>
                <option>Aguardando</option>
                <option>Finalizado</option>
              </select>

              <input
                placeholder="Buscar cliente ou produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800 text-sm">
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Telefone</th>
                <th className="pb-3">Produto</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Falta</th>
                <th className="pb-3">Prazo</th>
                <th className="pb-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {servicosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-10 text-zinc-500"
                  >
                    Nenhum serviço cadastrado ainda.
                  </td>
                </tr>
              ) : (
                servicosFiltrados.map((item, index) => (
                  <tr
                    key={`${item.cliente}-${index}`}
                    className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
                  >
                    <td className="py-4 font-medium">{item.cliente}</td>

                    <td>
                      <a
                        href={`https://wa.me/55${item.telefone.replace(
                          /\D/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-400 hover:underline"
                      >
                        {item.telefone}
                      </a>
                    </td>

                    <td>{item.produto}</td>

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>{item.valor}</td>

                    <td className="text-amber-300">{item.restante}</td>

                    <td>{formatarData(item.prazo)}</td>

                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarServico(index)}
                          className="bg-blue-500 hover:bg-blue-400 text-black px-3 py-1 rounded-lg text-xs font-bold"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => marcarEntregue(index)}
                          className="bg-green-500 hover:bg-green-400 text-black px-3 py-1 rounded-lg text-xs font-bold"
                        >
                          Entregue
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
