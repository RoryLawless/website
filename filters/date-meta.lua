-- Quarto formats meta.date before filters run; retain the source publication date.
function Meta(meta)
  if meta["date-meta"] then
    return meta
  end

  local source = assert(io.open(quarto.doc.input_file, "r"))
  local date = pandoc.read(source:read("*a"), "markdown").meta.date
  source:close()

  if date then
    meta["date-meta"] = pandoc.utils.normalize_date(pandoc.utils.stringify(date))
  end
  return meta
end
