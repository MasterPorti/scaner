import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const inventarioPath = path.join(process.cwd(), 'inventario.json');

export interface Producto {
  codigo: string;
  nombre: string;
  cantidad: number;
  ultimaActualizacion: string;
}

interface InventarioData {
  productos: Producto[];
}

async function leerInventario(): Promise<InventarioData> {
  try {
    const data = await fs.readFile(inventarioPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { productos: [] };
  }
}

async function guardarInventario(data: InventarioData): Promise<void> {
  await fs.writeFile(inventarioPath, JSON.stringify(data, null, 2), 'utf-8');
}

// GET - Obtener inventario completo
export async function GET() {
  try {
    const inventario = await leerInventario();
    return NextResponse.json(inventario);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al leer el inventario' },
      { status: 500 }
    );
  }
}

// POST - Agregar o actualizar producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, nombre, accion, cantidad = 1 } = body;

    if (!codigo) {
      return NextResponse.json(
        { error: 'El código del producto es requerido' },
        { status: 400 }
      );
    }

    const inventario = await leerInventario();
    const productoIndex = inventario.productos.findIndex(
      (p) => p.codigo === codigo
    );

    if (productoIndex !== -1) {
      // Producto existe, actualizar cantidad
      const producto = inventario.productos[productoIndex];

      if (accion === 'agregar') {
        producto.cantidad += cantidad;
      } else if (accion === 'quitar') {
        producto.cantidad = Math.max(0, producto.cantidad - cantidad);
      } else if (accion === 'actualizar') {
        producto.cantidad = cantidad;
      }

      if (nombre) {
        producto.nombre = nombre;
      }

      producto.ultimaActualizacion = new Date().toISOString();
      inventario.productos[productoIndex] = producto;
    } else {
      // Producto no existe, crear nuevo
      inventario.productos.push({
        codigo,
        nombre: nombre || `Producto ${codigo}`,
        cantidad: cantidad,
        ultimaActualizacion: new Date().toISOString(),
      });
    }

    await guardarInventario(inventario);
    return NextResponse.json({ success: true, inventario });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar el inventario' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
      return NextResponse.json(
        { error: 'El código del producto es requerido' },
        { status: 400 }
      );
    }

    const inventario = await leerInventario();
    inventario.productos = inventario.productos.filter(
      (p) => p.codigo !== codigo
    );

    await guardarInventario(inventario);
    return NextResponse.json({ success: true, inventario });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar el producto' },
      { status: 500 }
    );
  }
}
