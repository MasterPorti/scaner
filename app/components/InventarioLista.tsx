'use client';

import { Producto } from '../api/inventario/route';

interface InventarioListaProps {
  productos: Producto[];
  onAgregar: (codigo: string) => void;
  onQuitar: (codigo: string) => void;
  onEliminar: (codigo: string) => void;
}

export default function InventarioLista({ productos, onAgregar, onQuitar, onEliminar }: InventarioListaProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay productos en el inventario. Escanea un código de barras para comenzar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Inventario ({productos.length} productos)
      </h2>
      {productos.map((producto) => (
        <div
          key={producto.codigo}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{producto.nombre}</h3>
              <p className="text-sm text-gray-500">Código: {producto.codigo}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{producto.cantidad}</p>
              <p className="text-xs text-gray-500">unidades</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onAgregar(producto.codigo)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
            >
              + Agregar
            </button>
            <button
              onClick={() => onQuitar(producto.codigo)}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
              disabled={producto.cantidad === 0}
            >
              - Quitar
            </button>
            <button
              onClick={() => onEliminar(producto.codigo)}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
            >
              Eliminar
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Última actualización: {new Date(producto.ultimaActualizacion).toLocaleString('es-ES')}
          </p>
        </div>
      ))}
    </div>
  );
}
