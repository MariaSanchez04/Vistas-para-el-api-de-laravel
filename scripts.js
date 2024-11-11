// URLs de la API
const apiUrls = {
    products: 'http://laravel10api.test/api/products',
    proveedores: 'http://laravel10api.test/api/proveedors',
    compras: 'http://laravel10api.test/api/compras'
};

// Instancias de DataTables
let productTable;
let proveedorTable;
let compraTable;

// Inicializar DataTables y cargar datos
document.addEventListener('DOMContentLoaded', () => {
    productTable = $('#productTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        }
    });
    proveedorTable = $('#proveedorTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        }
    });
    compraTable = $('#compraTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        }
    });

    // Inicializar Select2
    $('.select2').select2({
        width: '100%',
        language: 'es'
    });
    
    // Cargar datos iniciales
    fetchProducts();
    fetchProveedores();
    fetchCompras();
    
    // Cargar opciones en los selects
    loadSelectOptions();
});

// Calcular total al cambiar cantidad o precio
document.getElementById('cantidad').addEventListener('input', calculateTotal);
document.getElementById('price').addEventListener('input', calculateTotal);

function calculateTotal() {
    const cantidad = document.getElementById('cantidad').value;
    const precio = document.getElementById('price').value;
    const total = (cantidad * precio).toFixed(2);
    document.getElementById('total').value = total;
}

// Cargar opciones en los selects
async function loadSelectOptions() {
    try {
        // Cargar productos
        const productsResponse = await fetch(apiUrls.products);
        const products = await productsResponse.json();
        console.log('Productos cargados:', products);
        const productSelect = document.getElementById('product_id');
        productSelect.innerHTML = '<option value="">Seleccione un producto</option>';
        products.forEach(product => {
            productSelect.innerHTML += `<option value="${product.id}">${product.name}</option>`;
        });
        $('.select2').select2();

        // Cargar proveedores
        const proveedoresResponse = await fetch(apiUrls.proveedores);
        const proveedores = await proveedoresResponse.json();
        console.log('Proveedores cargados:', proveedores);
        const proveedorSelect = document.getElementById('proveedor_id');
        proveedorSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';
        proveedores.forEach(proveedor => {
            proveedorSelect.innerHTML += `<option value="${proveedor.id}">${proveedor.nombre}</option>`;
        });

        // Refrescar Select2
        $('.select2').select2();
    } catch (error) {
        console.error('Error al cargar opciones:', error);
        alert('Error al cargar las opciones de productos y proveedores');
    }
}



document.addEventListener('DOMContentLoaded', () => {
    // Otras inicializaciones
    console.log('Cargando opciones de selects...');
    loadSelectOptions();
});

// Operaciones CRUD de Compras
async function fetchCompras() {
    try {
        const response = await fetch(apiUrls.compras);
        const compras = await response.json();
        
        compraTable.clear();
        compras.forEach(compra => {
            const productoName = compra.producto ? compra.producto.name : 'Sin producto';
            const proveedorName = compra.proveedor ? compra.proveedor.nombre : 'Sin proveedor';
            const total = (compra.cantidad * compra.price).toFixed(2);

            compraTable.row.add([
                compra.id,
                productoName,
                proveedorName,
                compra.cantidad,
                `$${compra.price}`,
                `$${total}`,
                `<button class="btn btn-warning btn-sm" onclick="openCompraModal(${compra.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCompra(${compra.id})">Eliminar</button>`
            ]);
            
        });
        compraTable.draw();
    } catch (error) {
        console.error('Error al cargar compras:', error);
        alert('Error al cargar compras');
    }
}

async function openCompraModal(compraId = null) {
    const modal = document.getElementById('compraModal');
    const form = document.getElementById('compraForm');

    loadSelectOptions();

    if (compraId) {
        try {
            const response = await fetch(`${apiUrls.compras}/${compraId}`);
            const compra = await response.json();

            // Llenar el formulario con los datos de la compra
            document.getElementById('compraId').value = compra.id;
            document.getElementById('product_id').value = compra.product_id;
            document.getElementById('proveedor_id').value = compra.proveedor_id;
            document.getElementById('cantidad').value = compra.cantidad;
            document.getElementById('price').value = compra.price;
            calculateTotal();
            document.getElementById('compraModalLabel').innerText = 'Editar Compra';
        } catch (error) {
            console.error('Error al cargar compra:', error);
            alert('Error al cargar datos de la compra.');
            return;
        }
    } else {
        form.reset();
        document.getElementById('compraId').value = '';
        document.getElementById('compraModalLabel').innerText = 'Registrar Nueva Compra';
    }

    // Refrescar Select2
    $('.select2').trigger('change');
    new bootstrap.Modal(modal).show();
}



document.getElementById('compraForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('compraId').value; // ID de la compra (vacío si es nueva)
    const compraData = {
        product_id: document.getElementById('product_id').value,
        proveedor_id: document.getElementById('proveedor_id').value,
        cantidad: document.getElementById('cantidad').value,
        price: document.getElementById('price').value
    };

    // Validación de campos
    if (!compraData.product_id || !compraData.proveedor_id || !compraData.cantidad || !compraData.price) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrls.compras}/${id}` : apiUrls.compras;

        console.log(`Enviando datos a ${url}`, compraData); // Depuración
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(compraData)
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        // Refrescar tabla y cerrar modal
        await fetchCompras();
        bootstrap.Modal.getInstance(document.getElementById('compraModal')).hide();
        this.reset();
    } catch (error) {
        console.error('Error al guardar compra:', error);
        alert('Error al guardar compra');
    }
});


async function deleteCompra(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta compra?')) {
        try {
            const response = await fetch(`${apiUrls.compras}/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            await fetchCompras();
        } catch (error) {
            console.error('Error al eliminar compra:', error);
            alert('Error al eliminar compra');
        }
    }
}

// Operaciones CRUD de Productos
async function fetchProducts() {
    try {
        const response = await fetch(apiUrls.products);
        const products = await response.json();
        
        productTable.clear();
        products.forEach(product => {
            productTable.row.add([
                product.id,
                product.name,
                product.description || '-',
                product.stock,
                `<button class="btn btn-warning btn-sm" onclick="openProductModal(${product.id}, '${product.name}', '${product.description}', ${product.stock})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Eliminar</button>`
            ]);
        });
        productTable.draw();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        alert('Error al cargar productos');
    }
}

function openProductModal(id = null, name = '', description = '', stock = '') {
    document.getElementById('productId').value = id || '';
    document.getElementById('name').value = name;
    document.getElementById('description').value = description;
    document.getElementById('stock').value = stock;
    document.getElementById('productModalLabel').innerText = id ? 'Editar Producto' : 'Agregar Nuevo Producto';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        stock: document.getElementById('stock').value
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrls.products}/${id}` : apiUrls.products;

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        fetchProducts();
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        this.reset();
    } catch (error) {
        console.error('Error al guardar producto:', error);
        alert('Error al guardar producto');
    }
});

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            await fetch(`${apiUrls.products}/${id}`, { method: 'DELETE' });
            fetchProducts();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Error al eliminar producto');
        }
    }
}

// Operaciones CRUD de Proveedores
async function fetchProveedores() {
    try {
        const response = await fetch(apiUrls.proveedores);
        const proveedores = await response.json();
        
        proveedorTable.clear();
        proveedores.forEach(proveedor => {
            proveedorTable.row.add([
                proveedor.id,
                proveedor.nombre,
                proveedor.correo || '-',
                proveedor.telefono,
                `<button class="btn btn-warning btn-sm" onclick="openProveedorModal(${proveedor.id}, '${proveedor.nombre}', '${proveedor.correo}', '${proveedor.telefono}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProveedor(${proveedor.id})">Eliminar</button>`
            ]);
        });
        proveedorTable.draw();
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        alert('Error al cargar proveedores');
    }
}

function openProveedorModal(id = null, nombre = '', correo = '', telefono = '') {
    document.getElementById('proveedorId').value = id || '';
    document.getElementById('nombre').value = nombre;
    document.getElementById('correo').value = correo;
    document.getElementById('telefono').value = telefono;
    document.getElementById('proveedorModalLabel').innerText = id ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor';
    new bootstrap.Modal(document.getElementById('proveedorModal')).show();
}

document.getElementById('proveedorForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('proveedorId').value;
    const proveedorData = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrls.proveedores}/${id}` : apiUrls.proveedores;

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proveedorData)
        });

        fetchProveedores();
        bootstrap.Modal.getInstance(document.getElementById('proveedorModal')).hide();
        this.reset();
    } catch (error) {
        console.error('Error al guardar proveedor:', error);
        alert('Error al guardar proveedor');
    }
});

async function deleteProveedor(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        try {
            await fetch(`${apiUrls.proveedores}/${id}`, { method: 'DELETE' });
            fetchProveedores();
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            alert('Error al eliminar proveedor');
        }
    }
}   