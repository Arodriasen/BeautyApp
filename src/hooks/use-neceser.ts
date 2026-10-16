import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';

import { ServicioAvisos } from '@/application/avisos/ServicioAvisos';
import { ServicioCompra } from '@/application/ServicioCompra';
import { ServicioEscaneo } from '@/application/ServicioEscaneo';
import { ServicioNeceser } from '@/application/ServicioNeceser';
import { CatalogoEnCadena } from '@/infrastructure/catalogo/CatalogoEnCadena';
import { OpenBeautyFacts } from '@/infrastructure/catalogo/OpenBeautyFacts';
import { UpcItemDb } from '@/infrastructure/catalogo/UpcItemDb';
import { FotosEnDispositivo } from '@/infrastructure/fotos/FotosEnDispositivo';
import { ExpoNotificador } from '@/infrastructure/notificaciones/ExpoNotificador';
import { SqliteAjustesRepositorio } from '@/infrastructure/sqlite/SqliteAjustesRepositorio';
import { SqliteCompraRepositorio } from '@/infrastructure/sqlite/SqliteCompraRepositorio';
import { SqliteProductoRepositorio } from '@/infrastructure/sqlite/SqliteProductoRepositorio';
import { SqliteUnidadRepositorio } from '@/infrastructure/sqlite/SqliteUnidadRepositorio';

/** Orden de consulta: primero la especializada en cosmética, luego la general. */
const catalogo = new CatalogoEnCadena([new OpenBeautyFacts(), new UpcItemDb()]);
const fotos = new FotosEnDispositivo();
const notificador = new ExpoNotificador();

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

export function useEscaneo(): ServicioEscaneo {
  const db = useSQLiteContext();
  return useMemo(() => new ServicioEscaneo(new SqliteProductoRepositorio(db), catalogo), [db]);
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
