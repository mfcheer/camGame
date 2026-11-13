// One canonical entry per word; retain book spellings as lookup aliases.
export function normalizeWordKey(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase().replace(/[.!?,;:]+$/u,'');
}

export function mergeVocabulary(...collections) {
  const result=[], index=new Map();
  for(const entries of collections){
    for(const incoming of entries){
      const id=normalizeWordKey(incoming.id || incoming.word);
      if(!id)continue;
      const aliases=[...new Set((incoming.aliases||[]).map(normalizeWordKey).filter(key=>key && key!==id))];
      const matches=[...new Set([id,...aliases].map(key=>index.get(key)).filter(Boolean))];
      if(matches.length>1)throw new Error(`Conflicting vocabulary aliases: ${id}`);
      const existing=matches[0];
      if(existing){
        const allAliases=new Set([...existing.aliases,...aliases,id]);allAliases.delete(existing.id);
        existing.aliases=[...allAliases];
        const sources=[...(existing.sources||[]),...(incoming.sources||[])];
        existing.sources=[...new Map(sources.map(source=>[`${source.bookId}:${source.form}`,source])).values()];
        for(const alias of existing.aliases)index.set(alias,existing);
      }else{
        const word={...incoming,id,word:normalizeWordKey(incoming.word||id),aliases,sources:[...(incoming.sources||[])]};
        result.push(word);index.set(id,word);for(const alias of aliases)index.set(alias,word);
      }
    }
  }
  return result;
}
