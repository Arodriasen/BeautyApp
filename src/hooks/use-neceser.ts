import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';

import { ServicioAvisos } from '@/application/avisos/ServicioAvisos';
import { ServicioIngredientes } from '@/application/ingredientes/ServicioIngredientes';
import { ServicioCompra } from '@/application/ServicioCompra';
import { ServicioEscaneo } from '@/application/ServicioEscaneo';
import { ServicioNeceser } from '@/application/ServicioNeceser';
import { BuscadorEnCadena } from '@/infrastructure/catalogo/BuscadorEnCadena';
import { CatalogoEnCadena } from '@/infrastructure/catalogo/CatalogoEnCadena';
import { InciApi } from '@/infrastructure/catalogo/InciApi';
import { MakeupApi } from '@/infrastructure/catalogo/MakeupApi';
import { ObfIngredientes } from '@/infrastructure/catalogo/ObfIngredientes';
import { OpenBeautyFacts } from '@/infrastructure/catalogo/OpenBeautyFacts';
import { UpcItemDb } from '@/infrastructure/catalogo/UpcItemDb';
import { FotosEnDispositivo } from '@/infrastructure/fotos/FotosEnDispositivo';
import { ExpoNotificador } from '@/infrastructure/notificaciones/ExpoNotificador';
import { SqliteAjustesRepositorio } from '@/infrastructure/sqlite/SqliteAjustesRepositorio';
import { SqliteCompraRepositorio } from '@/infrastructure/sqlite/SqliteCompraRepositorio';
import { SqliteProductoRepositorio } from '@/infrastructure/sqlite/SqliteProductoRepositorio';
import { SqliteUnidadRepositorio } from '@/infrastructure/sqlite/SqliteUnidadRepositorio';

const obf = new OpenBeautyFacts();
const upc = new UpcItemDb();
/** Por código: primero la especializada en cosmética, luego la general. */
const catalogo = new CatalogoEnCadena([obf, upc]);
/**
 * Por nombre: Open Beauty Facts y Makeup API (catálogo con tonos y colores) a la vez;
 * UPCitemdb solo si salen pocos (cupo de 100 al día).
 */
const makeup = new MakeupApi();
const buscador = new BuscadorEnCadena([obf, makeup], [upc]);
const fotos = new FotosEnDispositivo();
const notificador = new ExpoNotificador();
const fuenteIngredientes = new ObfIngredientes();
const inciApi = new InciApi();

export function useAvisos(): ServicioAvisos {
  const db = useSQLiteContext();
  return useMemo(
    () =>
      new ServicioAvisos(
        new SqliteProductoRepositorio(db),
        new SqliteUnidadRepositorio(db),
        new SqliteAjustesRepositorio(db),
        notificador,
      ),
    [db],
  );
}

export function useNeceser(): ServicioNeceser {
  const db = useSQLiteContext();
  const avisos = useAvisos();
  return useMemo(
    () =>
      new ServicioNeceser(new SqliteProductoRepositorio(db), new SqliteUnidadRepositorio(db), fotos, randomUUID, () => {
        // En segundo plano: reprogramar no debe retrasar ni romper la acción del usuario.
        avisos.sincronizar().catch(() => {});
      }),
    [db, avisos],
  );
}

export function useCompra(): ServicioCompra {
  const db = useSQLiteContext();
  const neceser = useNeceser();
  return useMemo(() => new ServicioCompra(new SqliteCompraRepositorio(db), neceser, randomUUID), [db, neceser]);
}

export function useIngredientes(): ServicioIngredientes {
  const db = useSQLiteContext();
  return useMemo(
    () =>
      new ServicioIngredientes(new SqliteProductoRepositorio(db), new SqliteAjustesRepositorio(db), fuenteIngredientes, inciApi),
    [db],
  );
}

/** Los términos a evitar, recargados cada vez que la pantalla gana el foco. */
export function useEvitar(): string[] {
  const ingredientes = useIngredientes();
  const [evitar, setEvitar] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      ingredientes.obtenerAjustes().then((a) => setEvitar(a.evitar));
    }, [ingredientes]),
  );
  return evitar;
}

export function useEscaneo(): ServicioEscaneo {
  const db = useSQLiteContext();
  return useMemo(() => new ServicioEscaneo(new SqliteProductoRepositorio(db), catalogo, buscador, makeup), [db]);
}

/**
 * Carga datos del neceser cada vez que la pantalla gana el foco (al volver de otra pantalla
 * se ve lo último). `recargar` permite refrescar tras una acción en la propia pantalla.
 *
 * `consulta` debe ser una función estable (definida fuera del componente); lo que varíe
 * va en `argumento`.
 */
export function useConsulta<A, T>(
  consulta: (neceser: ServicioNeceser, hoy: Date, argumento: A) => Promise<T>,
  argumento: A,
) {
  const neceser = useNeceser();
  const [datos, setDatos] = useState<T | undefined>(undefined);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const resultado = await consulta(neceser, new Date(), argumento);
    setDatos(resultado);
    setCargando(false);
  }, [consulta, neceser, argumento]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  return { datos, cargando, recargar, neceser };
}
