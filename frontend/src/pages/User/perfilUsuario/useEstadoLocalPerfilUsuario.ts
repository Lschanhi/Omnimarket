import { useState } from "react";
import type { LojaEntregaOpcao } from "../../../Services/produtos/lojaEntregaService";
import {
  TIPOS_LOGRADOURO_FALLBACK,
  type TipoLogradouroOption,
} from "../../../Services/user/enderecoService";
import type { PerfilVisaoId } from "../../../types/perfil";
import type {
  AvatarDestino,
  CategoriaLojaOption,
  LojaEntregaFormState,
  LojaFeedbackState,
  LojaFormState,
  ModalAberto,
  PerfilEnderecoFormState,
  PerfilFormState,
  PerfilTelefoneFormState,
  ProdutoFormState,
} from "./tipos";
import {
  LOJA_ENTREGA_FORM_INICIAL,
  LOJA_FORM_INICIAL,
  PERFIL_FORM_INICIAL,
  PRODUTO_FORM_INICIAL,
} from "./utilitarios";

export function useEstadoLocalPerfilUsuario() {
  const [visaoAtiva, setVisaoAtiva] = useState<PerfilVisaoId>("comprador");
  const [modalAberto, setModalAberto] = useState<ModalAberto>(null);
  const [perfilForm, setPerfilForm] = useState<PerfilFormState>(PERFIL_FORM_INICIAL);
  const [avatarDestino, setAvatarDestino] = useState<AvatarDestino>("usuario");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarLojaUrl, setAvatarLojaUrl] = useState("");
  const [avatarNomeArquivo, setAvatarNomeArquivo] = useState("");
  const [avatarErroAcao, setAvatarErroAcao] = useState("");
  const [isSalvandoAvatar, setIsSalvandoAvatar] = useState(false);
  const [telefonesForm, setTelefonesForm] = useState<PerfilTelefoneFormState[]>([]);
  const [novoTelefoneForm, setNovoTelefoneForm] = useState<PerfilTelefoneFormState | null>(null);
  const [telefonesRemovidos, setTelefonesRemovidos] = useState<number[]>([]);
  const [enderecosForm, setEnderecosForm] = useState<PerfilEnderecoFormState[]>([]);
  const [novoEnderecoForm, setNovoEnderecoForm] = useState<PerfilEnderecoFormState | null>(null);
  const [enderecosRemovidos, setEnderecosRemovidos] = useState<number[]>([]);
  const [lojaForm, setLojaForm] = useState<LojaFormState>(LOJA_FORM_INICIAL);
  const [produtoForm, setProdutoForm] = useState<ProdutoFormState>(PRODUTO_FORM_INICIAL);
  const [entregaLojaForm, setEntregaLojaForm] =
    useState<LojaEntregaFormState>(LOJA_ENTREGA_FORM_INICIAL);
  const [entregasLoja, setEntregasLoja] = useState<LojaEntregaOpcao[]>([]);
  const [produtoImagemArquivo, setProdutoImagemArquivo] = useState<File | null>(null);
  const [tiposLogradouro, setTiposLogradouro] = useState<TipoLogradouroOption[]>(
    TIPOS_LOGRADOURO_FALLBACK,
  );
  const [perfilErroAcao, setPerfilErroAcao] = useState("");
  const [lojaErroAcao, setLojaErroAcao] = useState("");
  const [produtoErroAcao, setProdutoErroAcao] = useState("");
  const [entregaErroAcao, setEntregaErroAcao] = useState("");
  const [isSalvandoPerfil, setIsSalvandoPerfil] = useState(false);
  const [isSalvandoLoja, setIsSalvandoLoja] = useState(false);
  const [isSalvandoProduto, setIsSalvandoProduto] = useState(false);
  const [isRemovendoProduto, setIsRemovendoProduto] = useState(false);
  const [produtoConfirmandoExclusao, setProdutoConfirmandoExclusao] = useState(false);
  const [isCarregandoEntregas, setIsCarregandoEntregas] = useState(false);
  const [isSalvandoEntrega, setIsSalvandoEntrega] = useState(false);
  const [entregaRemovendoId, setEntregaRemovendoId] = useState<number | null>(null);
  const [categoriaLojaAtiva, setCategoriaLojaAtiva] = useState("todas");
  const [categoriaLojaRemovendoId, setCategoriaLojaRemovendoId] = useState<string | null>(null);
  const [categoriaLojaModoExclusao, setCategoriaLojaModoExclusao] = useState(false);
  const [categoriaLojaPendenteExclusao, setCategoriaLojaPendenteExclusao] =
    useState<CategoriaLojaOption | null>(null);
  const [lojaFeedback, setLojaFeedback] = useState<LojaFeedbackState | null>(null);

  function fecharModalLocal() {
    setModalAberto(null);
    setAvatarDestino("usuario");
    setAvatarPreview("");
    setAvatarNomeArquivo("");
    setAvatarErroAcao("");
    setPerfilErroAcao("");
    setLojaErroAcao("");
    setProdutoErroAcao("");
    setEntregaErroAcao("");
    setProdutoConfirmandoExclusao(false);
    setProdutoForm(PRODUTO_FORM_INICIAL);
    setEntregaLojaForm(LOJA_ENTREGA_FORM_INICIAL);
    setProdutoImagemArquivo(null);
    setNovoTelefoneForm(null);
    setNovoEnderecoForm(null);
    setTelefonesRemovidos([]);
    setEnderecosRemovidos([]);
  }

  return {
    avatarDestino,
    avatarErroAcao,
    avatarLojaUrl,
    avatarNomeArquivo,
    avatarPreview,
    categoriaLojaAtiva,
    categoriaLojaModoExclusao,
    categoriaLojaPendenteExclusao,
    categoriaLojaRemovendoId,
    enderecosForm,
    enderecosRemovidos,
    entregaErroAcao,
    entregaLojaForm,
    entregaRemovendoId,
    entregasLoja,
    fecharModalLocal,
    isCarregandoEntregas,
    isRemovendoProduto,
    isSalvandoAvatar,
    isSalvandoEntrega,
    isSalvandoLoja,
    isSalvandoPerfil,
    isSalvandoProduto,
    lojaErroAcao,
    lojaFeedback,
    lojaForm,
    modalAberto,
    novoEnderecoForm,
    novoTelefoneForm,
    perfilErroAcao,
    perfilForm,
    produtoConfirmandoExclusao,
    produtoErroAcao,
    produtoForm,
    produtoImagemArquivo,
    setAvatarDestino,
    setAvatarErroAcao,
    setAvatarLojaUrl,
    setAvatarNomeArquivo,
    setAvatarPreview,
    setCategoriaLojaAtiva,
    setCategoriaLojaModoExclusao,
    setCategoriaLojaPendenteExclusao,
    setCategoriaLojaRemovendoId,
    setEnderecosForm,
    setEnderecosRemovidos,
    setEntregaErroAcao,
    setEntregaLojaForm,
    setEntregaRemovendoId,
    setEntregasLoja,
    setIsCarregandoEntregas,
    setIsRemovendoProduto,
    setIsSalvandoAvatar,
    setIsSalvandoEntrega,
    setIsSalvandoLoja,
    setIsSalvandoPerfil,
    setIsSalvandoProduto,
    setLojaErroAcao,
    setLojaFeedback,
    setLojaForm,
    setModalAberto,
    setNovoEnderecoForm,
    setNovoTelefoneForm,
    setPerfilErroAcao,
    setPerfilForm,
    setProdutoConfirmandoExclusao,
    setProdutoErroAcao,
    setProdutoForm,
    setProdutoImagemArquivo,
    setTelefonesForm,
    setTelefonesRemovidos,
    setTiposLogradouro,
    setVisaoAtiva,
    telefonesForm,
    telefonesRemovidos,
    tiposLogradouro,
    visaoAtiva,
  };
}
