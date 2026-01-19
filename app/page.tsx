'use client';

import { useState, useEffect } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import InventarioLista from './components/InventarioLista';
import { Producto } from './api/inventario/route';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [cantidadManual, setCantidadManual] = useState('1');

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const response = await fetch('/api/inventario');
      const data = await response.json();
      setProductos(data.productos);
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar el inventario');
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleScan = async (codigo: string) => {
    const productoExistente = productos.find((p) => p.codigo === codigo);

    if (productoExistente) {
      mostrarMensaje('success', `${productoExistente.nombre}: ${productoExistente.cantidad} unidades`);
    } else {
      const nombre = prompt(`Producto nuevo detectado.\nCódigo: ${codigo}\n\nIngresa el nombre del producto:`);
      if (nombre) {
        await agregarProducto(codigo, nombre, 1);
      }
    }
  };

  const agregarProducto = async (codigo: string, nombre: string, cantidad: number) => {
    try {
      const response = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, nombre, cantidad, accion: 'agregar' }),
      });

      const data = await response.json();
      if (data.success) {
        setProductos(data.inventario.productos);
        mostrarMensaje('success', `${nombre} agregado correctamente`);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al agregar producto');
    }
  };

  const handleAgregar = async (codigo: string) => {
    try {
      const response = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, accion: 'agregar', cantidad: 1 }),
      });

      const data = await response.json();
      if (data.success) {
        setProductos(data.inventario.productos);
        mostrarMensaje('success', 'Producto agregado (+1)');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al agregar producto');
    }
  };

  const handleQuitar = async (codigo: string) => {
    try {
      const response = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, accion: 'quitar', cantidad: 1 }),
      });

      const data = await response.json();
      if (data.success) {
        setProductos(data.inventario.productos);
        mostrarMensaje('success', 'Producto quitado (-1)');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al quitar producto');
    }
  };

  const handleEliminar = async (codigo: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventario?codigo=${codigo}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setProductos(data.inventario.productos);
        mostrarMensaje('success', 'Producto eliminado');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al eliminar producto');
    }
  };

  const handleAgregarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoManual) {
      mostrarMensaje('error', 'El código es requerido');
      return;
    }

    await agregarProducto(codigoManual, nombreManual || `Producto ${codigoManual}`, parseInt(cantidadManual) || 1);
    setCodigoManual('');
    setNombreManual('');
    setCantidadManual('1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sistema de Inventario
          </h1>
          <p className="text-gray-600">Escanea códigos de barras para gestionar tu inventario</p>
        </header>

        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              mensaje.tipo === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors ${
                isScanning
                  ? 'bg-gray-300 text-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isScanning ? 'Escaneando...' : 'Iniciar Escáner'}
            </button>
          </div>

          <BarcodeScanner
            onScan={handleScan}
            isScanning={isScanning}
            onStop={() => setIsScanning(false)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Producto Manualmente</h2>
          <form onSubmit={handleAgregarManual} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de barras
              </label>
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 7501234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto
              </label>
              <input
                type="text"
                value={nombreManual}
                onChange={(e) => setNombreManual(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Coca Cola 600ml"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad inicial
              </label>
              <input
                type="number"
                value={cantidadManual}
                onChange={(e) => setCantidadManual(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Agregar Producto
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <InventarioLista
            productos={productos}
            onAgregar={handleAgregar}
            onQuitar={handleQuitar}
            onEliminar={handleEliminar}
          />
        </div>
      </div>
    </div>
  );
}
