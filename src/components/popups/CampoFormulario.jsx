// Input genérico do formulário de pop-up no admin: o tipo do campo (definido no registry)
// decide qual widget desenhar. Novos modelos não precisam de nenhum JSX novo aqui — só
// usar um dos tipos já suportados (texto, textarea, imagem, url).
export default function CampoFormulario({ campo, valor, onChange, idPrefix }) {
  const id = `${idPrefix}-${campo.nome}`;
  const rotulo = (
    <label htmlFor={id} className="text-xs text-gray-500 font-bold block mb-1 uppercase">
      {campo.rotulo} {campo.obrigatorio && <span className="text-red-500">*</span>}
    </label>
  );

  if (campo.tipo === 'textarea') {
    return (
      <div>
        {rotulo}
        <textarea
          id={id}
          rows="3"
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106] resize-none"
        />
      </div>
    );
  }

  if (campo.tipo === 'imagem') {
    return (
      <div>
        {rotulo}
        {valor && (
          <img src={valor} alt="" className="w-20 h-20 object-cover rounded-lg mb-2 border border-gray-200" />
        )}
        <input
          type="file"
          id={id}
          accept="image/*"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer"
        />
        {valor && <p className="text-[10px] text-gray-400 mt-1">Selecione um novo arquivo para substituir a imagem atual.</p>}
      </div>
    );
  }

  // 'texto' | 'url'
  return (
    <div>
      {rotulo}
      <input
        id={id}
        type="text"
        value={valor || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
      />
    </div>
  );
}
