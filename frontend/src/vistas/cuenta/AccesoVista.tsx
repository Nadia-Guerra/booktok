// Iniciar sesión (EP-03) o crear una cuenta (EP-02).
import { registroEntrada, sesionEntrada } from '@dlbp/shared';
import { useState } from 'react';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Pantalla } from '../../componentes/Pantalla';
import { Selector } from '../../componentes/Selector';
import { useEntrar, useRegistrarse } from '../../hooks/useCuenta';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';

const MODOS = [
  { valor: 'entrar', titulo: 'Entrar' },
  { valor: 'registro', titulo: 'Crear cuenta' },
] as const;

const CORREO = { autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address', autoComplete: 'email' } as const;
const CLAVE = { secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false } as const;

function FormularioEntrar({ alTerminar }: { alTerminar: () => void }) {
  const form = useFormulario({
    esquema: sesionEntrada,
    iniciales: { correo: '', password: '' },
    enviar: useEntrar(),
    alTerminar,
  });
  return (
    <>
      <CampoTexto etiqueta="Correo" {...CORREO} {...form.campo('correo')} />
      <CampoTexto etiqueta="Contraseña" {...CLAVE} {...form.campo('password')} onSubmitEditing={form.enviar} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Entrar" onPress={form.enviar} cargando={form.enviando} />
    </>
  );
}

function FormularioRegistro({ alTerminar }: { alTerminar: () => void }) {
  const form = useFormulario({
    esquema: registroEntrada,
    iniciales: { nombre: '', correo: '', password: '' },
    enviar: useRegistrarse(),
    alTerminar,
  });
  return (
    <>
      <CampoTexto etiqueta="Nombre" autoComplete="name" {...form.campo('nombre')} />
      <CampoTexto etiqueta="Correo" {...CORREO} {...form.campo('correo')} />
      <CampoTexto etiqueta="Contraseña (mínimo 8)" {...CLAVE} {...form.campo('password')} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Crear cuenta" onPress={form.enviar} cargando={form.enviando} />
    </>
  );
}

export function AccesoVista({ navigation }: PropsDeRaiz<'Acceso'>) {
  const [modo, setModo] = useState<(typeof MODOS)[number]['valor']>('entrar');
  const Formulario = modo === 'entrar' ? FormularioEntrar : FormularioRegistro;
  return (
    <Pantalla>
      <Selector opciones={MODOS} valor={modo} onCambiar={setModo} />
      <Formulario alTerminar={() => navigation.goBack()} />
    </Pantalla>
  );
}
