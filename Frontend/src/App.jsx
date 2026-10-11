import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getJson, mutateJson } from './api.js';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const preciseCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat('en-US');

function Icon({ name, size = 19, strokeWidth = 1.8 }) {
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    chart: <><path d="M4 19.5h16" /><path d="M6.5 16V11" /><path d="M12 16V5" /><path d="M17.5 16V8" /></>,
    box: <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" /></>,
    receipt: <><path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v16l-3.5-2-4 2-4-2-3.5 2V5A1.5 1.5 0 0 1 6 3.5Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M20 20v-1.5a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2.6L20 12M4 12l2.9 5.6A7 7 0 0 0 18.5 15" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    spark: <><path d="m12 3 1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-2.5L12 3Z" /><path d="m19 3 .6 2.4L22 6l-2.4.6L19 9l-.6-2.4L16 6l2.4-.6L19 3Z" /></>,
    bars: <><path d="M4 19.5h16" /><rect x="6" y="11" width="2.5" height="6.5" rx="1" /><rect x="10.75" y="7.5" width="2.5" height="10" rx="1" /><rect x="15.5" y="4.5" width="2.5" height="13" rx="1" /></>,
    moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  };

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Reveal({ children, delay = 0 }) {
  const element = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = element.current;
    document.documentElement.classList.add('motion-ready');

    if (!node || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(node);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={element} className={`reveal ${visible ? 'is-visible' : ''}`} style={{ '--reveal-delay': `${delay}ms` }}>{children}</div>;
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function StatCard({ icon, label, value, note, tone, loading }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} size={18} /></div>
      <p className="stat-label">{label}</p>
      {loading ? <div className="skeleton stat-skeleton" /> : <strong className="stat-value">{value}</strong>}
      <span className="stat-note">{note}</span>
    </article>
  );
}

function SalesChart({ rows = [], loading }) {
  const chart = useMemo(() => {
    const width = 720;
    const height = 244;
    const pad = { top: 18, right: 12, bottom: 42, left: 64 };
    const values = rows.map((row) => Number(row.revenue) || 0);
    const max = Math.max(...values, 1);
    const points = values.map((value, index) => ({
      x: pad.left + (rows.length <= 1 ? 0 : index * (width - pad.left - pad.right) / (rows.length - 1)),
      y: pad.top + (height - pad.top - pad.bottom) * (1 - value / max),
      value,
      month: rows[index]?.month,
    }));
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = points.length ? `${line} L ${points.at(-1).x} ${height - pad.bottom} L ${points[0].x} ${height - pad.bottom} Z` : '';

    return { width, height, pad, max, points, line, area };
  }, [rows]);

  const labelIndexes = chart.points.map((_, index) => index).filter((index) => index % 2 === 0 || index === chart.points.length - 1);

  if (loading) return <div className="chart-skeleton skeleton" />;
  if (!rows.length) return <div className="empty-inline">No sales data for this period.</div>;

  return (
    <div className="chart-wrap">
      <div className="chart-y-labels">
        {[1, 0.66, 0.33, 0].map((part) => <span key={part}>{compactCurrency.format(chart.max * part)}</span>)}
      </div>
      <svg className="sales-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Paid revenue by month">
        <defs>
          <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#278e83" stopOpacity=".18" />
            <stop offset="100%" stopColor="#278e83" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const y = chart.pad.top + index * (chart.height - chart.pad.top - chart.pad.bottom) / 3;
          return <line key={index} x1={chart.pad.left} x2={chart.width - chart.pad.right} y1={y} y2={y} className="chart-grid" />;
        })}
        <path d={chart.area} fill="url(#salesFill)" />
        <path d={chart.line} className="chart-line" />
        {chart.points.map((point, index) => <circle key={point.month || index} cx={point.x} cy={point.y} r="3.4" className="chart-dot"><title>{point.month}: {preciseCurrency.format(point.value)}</title></circle>)}
        {labelIndexes.map((index) => {
          const point = chart.points[index];
          const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${point.month}-01T00:00:00`));
          return <text key={point.month} x={point.x} y={chart.height - 12} textAnchor="middle" className="chart-month">{label}</text>;
        })}
      </svg>
    </div>
  );
}

function DonutChart({ categories = [], loading }) {
  const colors = ['#248c80', '#86b9ad', '#e7b66b', '#d88670', '#8890a5'];
  const total = categories.reduce((sum, category) => sum + Number(category.revenue || 0), 0);
  const circumference = 2 * Math.PI * 49;
  let offset = 0;

  if (loading) return <div className="donut-skeleton skeleton" />;
  if (!categories.length || total === 0) return <div className="empty-inline">No category revenue yet.</div>;

  return (
    <div className="donut-content">
      <div className="donut-chart" role="img" aria-label="Revenue share by category">
        <svg viewBox="0 0 124 124">
          <circle cx="62" cy="62" r="49" className="donut-track" />
          {categories.map((category, index) => {
            const amount = circumference * Number(category.revenue || 0) / total;
            const circle = <circle key={category.id} cx="62" cy="62" r="49" fill="none" stroke={colors[index % colors.length]} strokeWidth="13" strokeDasharray={`${amount} ${circumference - amount}`} strokeDashoffset={-offset} transform="rotate(-90 62 62)" />;
            offset += amount;
            return circle;
          })}
        </svg>
        <div className="donut-center"><strong>{compactCurrency.format(total)}</strong><span>revenue</span></div>
      </div>
      <div className="category-list">
        {categories.map((category, index) => <div className="category-row" key={category.id}>
          <span className="category-dot" style={{ backgroundColor: colors[index % colors.length] }} />
          <span className="category-name" title={category.name}>{category.name}</span>
          <strong>{compactCurrency.format(Number(category.revenue))}</strong>
        </div>)}
      </div>
    </div>
  );
}

function ProductTable({ products = [], loading }) {
  const max = Math.max(...products.map((product) => Number(product.units_sold) || 0), 1);

  if (loading) return <div className="table-skeleton"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>;
  if (!products.length) return <div className="empty-inline">No product sales to show.</div>;

  return <div className="table-scroll"><table>
    <thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th></tr></thead>
    <tbody>{products.map((product, index) => <tr key={product.id}>
      <td><div className="product-cell"><span className={`product-rank rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="product-name-wrap"><strong>{product.name}</strong><small>{product.sku}</small></span></div></td>
      <td><div className="units-cell"><span>{number.format(product.units_sold)}</span><span className="units-track"><i style={{ width: `${Math.max(6, Number(product.units_sold) / max * 100)}%` }} /></span></div></td>
      <td className="revenue-cell">{preciseCurrency.format(Number(product.revenue))}</td>
    </tr>)}</tbody>
  </table></div>;
}

function ActivityPanel({ mode, onModeChange, orders = [], customers = [], loading }) {
  return <section className="panel activity-panel" id="activity">
    <div className="panel-heading activity-heading">
      <div><p className="eyebrow">Store activity</p><h2>{mode === 'orders' ? 'Recent orders' : 'Top customers'}</h2></div>
      <div className="segmented" role="tablist" aria-label="Activity view">
        <button className={mode === 'orders' ? 'selected' : ''} onClick={() => onModeChange('orders')} role="tab" aria-selected={mode === 'orders'}>Orders</button>
        <button className={mode === 'customers' ? 'selected' : ''} onClick={() => onModeChange('customers')} role="tab" aria-selected={mode === 'customers'}>Customers</button>
      </div>
    </div>
    {loading ? <div className="activity-skeleton"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div> : mode === 'orders' ? (
      orders.length ? <div className="orders-list">{orders.map((order) => {
        const total = order.payments?.[0]?.amount;
        return <div className="order-row" key={order.id}>
          <span className="order-avatar">#{String(order.id).padStart(3, '0')}</span>
          <span className="order-customer"><strong>{order.customer?.name || 'Customer'}</strong><small>{formatDate(order.ordered_at)}</small></span>
          <span className={`status-pill status-${order.status}`}>{order.status}</span>
          <strong className="order-total">{total == null ? '—' : preciseCurrency.format(Number(total))}</strong>
        </div>;
      })}</div> : <div className="empty-inline">No orders yet.</div>
    ) : (
      customers.length ? <div className="customers-list">{customers.map((customer, index) => <div className="customer-row" key={customer.id}>
        <span className={`customer-avatar customer-${index % 4}`}>{initials(customer.name)}</span>
        <span className="customer-details"><strong>{customer.name}</strong><small>{number.format(customer.paid_orders)} paid orders</small></span>
        <strong className="customer-spend">{preciseCurrency.format(Number(customer.total_spent))}</strong>
      </div>)}</div> : <div className="empty-inline">No paid customer activity yet.</div>
    )}
  </section>;
}

const RESOURCE_CONFIG = {
  customers: { label: 'Customers', fields: [
    { key: 'name', label: 'Full name', required: true, type: 'text' }, { key: 'email', label: 'Email', required: true, type: 'email' }, { key: 'phone', label: 'Phone', type: 'text' },
  ], columns: ['name', 'email', 'phone'] },
  categories: { label: 'Categories', fields: [
    { key: 'name', label: 'Category name', required: true, type: 'text' }, { key: 'description', label: 'Description', type: 'textarea' },
  ], columns: ['name', 'description'] },
  products: { label: 'Products', fields: [
    { key: 'name', label: 'Product name', required: true, type: 'text' }, { key: 'sku', label: 'SKU', required: true, type: 'text' }, { key: 'category_id', label: 'Category', required: true, type: 'relation', resource: 'categories' }, { key: 'price', label: 'Price (USD)', required: true, type: 'number', min: 0, step: '0.01' }, { key: 'stock_quantity', label: 'Stock quantity', type: 'number', min: 0, step: 1 },
  ], columns: ['name', 'sku', 'category', 'price', 'stock_quantity'] },
  orders: { label: 'Orders', fields: [
    { key: 'customer_id', label: 'Customer', required: true, type: 'relation', resource: 'customers' }, { key: 'status', label: 'Status', type: 'select', options: ['pending', 'processing', 'shipped', 'completed', 'cancelled'] }, { key: 'ordered_at', label: 'Order date', type: 'datetime-local' },
  ], columns: ['id', 'customer', 'status', 'ordered_at'] },
  'order-items': { label: 'Order items', fields: [
    { key: 'order_id', label: 'Order', required: true, type: 'relation', resource: 'orders' }, { key: 'product_id', label: 'Product', required: true, type: 'relation', resource: 'products' }, { key: 'quantity', label: 'Quantity', required: true, type: 'number', min: 1, step: 1 }, { key: 'unit_price', label: 'Unit price (USD)', required: true, type: 'number', min: 0, step: '0.01' },
  ], columns: ['id', 'order_id', 'product', 'quantity', 'unit_price'] },
  payments: { label: 'Payments', fields: [
    { key: 'order_id', label: 'Order', required: true, type: 'relation', resource: 'orders' }, { key: 'amount', label: 'Amount (USD)', required: true, type: 'number', min: 0.01, step: '0.01' }, { key: 'status', label: 'Status', type: 'select', options: ['pending', 'paid', 'failed', 'refunded'] }, { key: 'paid_at', label: 'Paid at', type: 'datetime-local' },
  ], columns: ['id', 'order_id', 'amount', 'status', 'paid_at'] },
};

function displayValue(row, column) {
  if (column === 'category') return row.category?.name || '—';
  if (column === 'customer') return row.customer?.name || '—';
  if (column === 'product') return row.product?.name || '—';
  const value = row[column];
  if (value == null || value === '') return '—';
  if (column === 'price' || column === 'amount' || column === 'unit_price') return preciseCurrency.format(Number(value));
  if (column.endsWith('_at')) return formatDate(value);
  return String(value);
}

function initialForm(config, row) {
  return Object.fromEntries(config.fields.map(({ key, type }) => {
    let value = row?.[key] ?? '';
    if (type === 'datetime-local' && value) value = new Date(value).toISOString().slice(0, 16);
    if (type === 'select' && !value) value = config.fields.find((candidate) => candidate.key === key)?.options?.[0] || '';
    return [key, value];
  }));
}

function ManageData() {
  const [resource, setResource] = useState('products');
  const [rows, setRows] = useState([]);
  const [relations, setRelations] = useState({});
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const config = RESOURCE_CONFIG[resource];

  const loadRows = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ per_page: '100' });
      if (search.trim()) params.set('search', search.trim());
      const result = await getJson(`/${resource}?${params}`, signal);
      setRows(result.data || []);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'Could not load records.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [resource, search]);

  useEffect(() => {
    const controller = new AbortController();
    loadRows(controller.signal);
    return () => controller.abort();
  }, [loadRows]);

  useEffect(() => {
    let active = true;
    const resources = ['customers', 'categories', 'products', 'orders'];
    Promise.all(resources.map(async (name) => {
      try {
        const result = await getJson(`/${name}?per_page=100`);
        return [name, result.data || []];
      } catch {
        return [name, []];
      }
    })).then((entries) => { if (active) setRelations(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, []);

  const startCreate = () => { setEditingId(null); setForm(initialForm(config)); setError(''); };
  const startEdit = (row) => { setEditingId(row.id); setForm(initialForm(config, row)); setError(''); };
  const closeForm = () => { setForm(null); setEditingId(null); };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {};
    for (const field of config.fields) {
      let value = form[field.key];
      if (value === '' && field.key === 'ordered_at') continue;
      if (value === '' && ['phone', 'description', 'paid_at'].includes(field.key)) value = null;
      else if (field.type === 'number' || field.type === 'relation') value = Number(value);
      payload[field.key] = value;
    }
    try {
      await mutateJson(`/${resource}${editingId ? `/${editingId}` : ''}`, editingId ? 'PUT' : 'POST', payload);
      closeForm();
      await loadRows();
    } catch (requestError) {
      setError(requestError.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (row) => {
    const cascadeNotice = resource === 'orders' ? '\n\nThis also deletes its order items and payments.' : '';
    if (!window.confirm(`Delete this ${config.label.toLowerCase().slice(0, -1)}?${cascadeNotice}`)) return;
    setError('');
    try {
      await mutateJson(`/${resource}/${row.id}`, 'DELETE');
      await loadRows();
    } catch (requestError) {
      setError(requestError.message || 'Could not delete this record.');
    }
  };

  return <div className="page-content manage-page">
    <section className="page-intro"><div><p className="eyebrow">STORE DATA</p><h1>Manage records<span>.</span></h1><p className="intro-copy">Add, update, and remove your store data from one place.</p></div><button className="primary-button" onClick={startCreate}>＋ Add {config.label.slice(0, -1)}</button></section>
    <section className="panel manager-panel">
      <div className="manager-toolbar"><label className="manager-select-label">Data type<select value={resource} onChange={(event) => { setResource(event.target.value); closeForm(); }}>
        {Object.entries(RESOURCE_CONFIG).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
      </select></label><label className="manager-search">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.label.toLowerCase()}…`} /></label></div>
      {error && <div className="manager-error" role="alert">{error}</div>}
      {form && <form className="record-form" onSubmit={submit}><div className="form-heading"><h2>{editingId ? `Edit ${config.label.slice(0, -1)}` : `New ${config.label.slice(0, -1)}`}</h2><button type="button" className="close-form" onClick={closeForm} aria-label="Close form">×</button></div><div className="form-grid">
        {config.fields.map((field) => <label className={field.type === 'textarea' ? 'form-field form-field-wide' : 'form-field'} key={field.key}>{field.label}{field.type === 'relation' ? <select required={field.required} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}><option value="">Choose…</option>{(relations[field.resource] || []).map((option) => <option value={option.id} key={option.id}>{option.name ? `${option.name} · #${option.id}` : `#${option.id}`}</option>)}</select> : field.type === 'select' ? <select value={form[field.key] || field.options[0]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} rows="3" /> : <input type={field.type} required={field.required} min={field.min} step={field.step} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />}</label>)}
      </div><div className="form-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create record'}</button></div></form>}
      <div className="table-scroll manager-table"><table><thead><tr>{config.columns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}<th>Actions</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={config.columns.length + 1}>Loading records…</td></tr> : rows.length ? rows.map((row) => <tr key={row.id}>{config.columns.map((column) => <td key={column}>{displayValue(row, column)}</td>)}<td><span className="row-actions"><button onClick={() => startEdit(row)}>Edit</button><button className="delete-action" onClick={() => remove(row)}>Delete</button></span></td></tr>) : <tr><td colSpan={config.columns.length + 1}>No records found.</td></tr>}
      </tbody></table></div>
      <div className="manager-footnote">Showing up to 100 records · Changes are saved to your DataScope database.</div>
    </section>
  </div>;
}
function Sidebar({ page, onNavigate }) {
  const links = [
    { label: 'Overview', href: '#overview', icon: 'grid', page: 'dashboard' },
    { label: 'Analytics', href: '#performance', icon: 'chart', page: 'dashboard' },
    { label: 'Products', href: '#products', icon: 'box', page: 'dashboard' },
    { label: 'Activity', href: '#activity', icon: 'receipt', page: 'dashboard' },
    { label: 'Manage data', href: '#manage', icon: 'users', page: 'manage' },
  ];

  return <aside className="sidebar">
    <a className="brand" href="#overview" aria-label="DataScope home">
      <span className="brand-mark"><Icon name="bars" size={21} strokeWidth={2} /></span>
      <span className="brand-name">Data<span>Scope</span></span>
    </a>
    <p className="nav-caption">WORKSPACE</p>
    <nav className="main-nav" aria-label="Main navigation">
      {links.map((link) => <a key={link.label} href={link.href} onClick={() => onNavigate(link.page)} className={page === link.page && (link.page === 'manage' || link.label === 'Overview') ? 'nav-link active' : 'nav-link'}><Icon name={link.icon} /><span>{link.label}</span></a>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-footer"><span className="version">v1.0</span></div>
    </div>
  </aside>;
}

function AuthPage({ theme, onThemeChange, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = mode === 'login'
        ? await mutateJson('/auth/login', 'POST', { email, password, remember })
        : await mutateJson('/auth/register', 'POST', { name, email, password, password_confirmation: passwordConfirmation });
      onAuthenticated(result.data);
    } catch (requestError) {
      setError(requestError.message || 'We could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-screen">
    <button className="theme-button auth-theme-button" type="button" onClick={onThemeChange} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={theme === 'dark'} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
    <section className="auth-card">
      <a href="#overview" className="auth-brand"><span className="brand-mark"><Icon name="bars" size={21} strokeWidth={2} /></span><span className="brand-name">Data<span>Scope</span></span></a>
      <div className="auth-heading"><p className="eyebrow">YOUR STORE, IN FOCUS</p><h1>{mode === 'login' ? <>Welcome back<span>.</span></> : <>Create your account<span>.</span></>}</h1><p>{mode === 'login' ? 'Sign in to continue to your analytics dashboard.' : 'Set up an account to securely access your store dashboard.'}</p></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label>Full name<input autoComplete="name" required maxLength="255" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}
        <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
        {mode === 'register' && <label>Confirm password<input type="password" autoComplete="new-password" minLength="8" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Enter your password again" /></label>}
        {mode === 'login' && <label className="remember-row"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>Keep me signed in</span></label>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<Icon name="arrow" size={17} /></button>
      </form>
      <p className="auth-switch">{mode === 'login' ? 'New to DataScope?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      
    </section>
    <p className="auth-footer">DataScope <span>·</span> Business analytics</p>
  </main>;
}

function AccountModal({ panel, user, onClose, onUpdated }) {
  const [name, setName] = useState(user.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isProfile = panel === 'profile';

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (isProfile) {
        const result = await mutateJson('/auth/profile', 'PUT', { name });
        onUpdated(result.data);
        setSuccess('Your profile has been updated.');
      } else {
        await mutateJson('/auth/password', 'PUT', {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        });
        setCurrentPassword('');
        setPassword('');
        setPasswordConfirmation('');
        setSuccess('Your password has been changed.');
      }
    } catch (requestError) {
      setError(requestError.message || 'We could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="account-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
      <div className="account-modal-heading"><div><p className="eyebrow">ACCOUNT SETTINGS</p><h2 id="account-modal-title">{isProfile ? 'Personal information' : 'Change password'}</h2></div><button type="button" className="account-close" onClick={onClose} aria-label="Close">×</button></div>
      <form className="account-form" onSubmit={submit}>
        {isProfile ? <>
          <label className="form-field">Full name<input autoComplete="name" required maxLength="255" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="form-field">Email address<input className="locked-input" type="email" value={user.email || ''} readOnly aria-readonly="true" /><small className="locked-hint">Email address can’t be changed.</small></label>
        </> : <>
          <label className="form-field">Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="form-field">New password<input type="password" autoComplete="new-password" minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label className="form-field">Confirm new password<input type="password" autoComplete="new-password" minLength="8" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /></label>
        </>}
        {error && <div className="account-message account-message-error" role="alert">{error}</div>}
        {success && <div className="account-message account-message-success" role="status">{success}</div>}
        <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : isProfile ? 'Save changes' : 'Update password'}</button></div>
      </form>
    </section>
  </div>;
}

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('datascope-theme') || 'light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityMode, setActivityMode] = useState('orders');
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountPanel, setAccountPanel] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setProfileMenuOpen(false); };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    const controller = new AbortController();
    getJson('/auth/user', controller.signal)
      .then((result) => setUser(result.data))
      .catch(() => setUser(null))
      .finally(() => { if (!controller.signal.aborted) setAuthLoading(false); });
    return () => controller.abort();
  }, []);
  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const [summary, sales, categories, products, orders, customers] = await Promise.all([
        getJson('/analytics/summary', signal),
        getJson('/analytics/sales-trend?months=12', signal),
        getJson('/analytics/revenue-by-category', signal),
        getJson('/analytics/top-products?limit=5', signal),
        getJson('/orders?per_page=5', signal),
        getJson('/analytics/top-customers?limit=5', signal),
      ]);
      setDashboard({
        summary: summary.data,
        sales: sales.data,
        categories: categories.data,
        products: products.data,
        orders: orders.data,
        customers: customers.data,
      });
      setRefreshedAt(new Date());
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'We could not load your dashboard.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('datascope-theme', theme);
  }, [theme]);

  const refresh = () => loadDashboard(new AbortController().signal);
  const signOut = async () => {
    try {
      await mutateJson('/auth/logout', 'POST');
      setDashboard(null);
      setUser(null);
      setPage('dashboard');
    } catch (requestError) {
      setError(requestError.message || 'Could not sign out. Please try again.');
    }
  };

  if (authLoading) return <main className="auth-loading">Loading your secure session…</main>;
  if (!user) return <AuthPage theme={theme} onThemeChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onAuthenticated={setUser} />;
  const stats = dashboard?.summary;

  return <div className="app-shell" id="overview">
    <Sidebar page={page} onNavigate={setPage} />
    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{page === 'manage' ? 'Manage data' : 'Overview'}</strong></div>
        <div className="topbar-actions">
          <span className="date-label">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span>
          <button className="refresh-button" onClick={refresh} disabled={loading} aria-label="Refresh dashboard" title="Refresh data"><Icon name="refresh" size={17} /></button>
          <button className="theme-button" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={theme === 'dark'} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
          <div className="profile-control" ref={profileMenuRef}>
            <button className="topbar-avatar" type="button" aria-label="Open account menu" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}>{initials(user?.name || 'Data Scope')}</button>
            {profileMenuOpen && <div className="profile-menu" role="menu">
              <div className="profile-menu-user"><strong>{user.name}</strong><span>{user.email}</span></div>
              <button type="button" role="menuitem" onClick={() => { setAccountPanel('profile'); setProfileMenuOpen(false); }}>Personal information</button>
              <button type="button" role="menuitem" onClick={() => { setAccountPanel('password'); setProfileMenuOpen(false); }}>Change password</button>
              <div className="profile-menu-divider" />
              <button type="button" role="menuitem" className="profile-menu-signout" onClick={signOut}><Icon name="logout" size={16} /> Sign out</button>
            </div>}
          </div>
        </div>
      </header>

      {page === 'manage' ? <ManageData /> : <div className="page-content">
        <section className="page-intro">
          <div><p className="eyebrow">YOUR STORE, AT A GLANCE</p><h1>Store overview<span>.</span></h1><p className="intro-copy">A clear view of sales, orders, and product performance.</p></div>
          <div className="intro-meta"><span className="intro-calendar"><Icon name="chart" size={16} /></span><span><strong>Sales trend</strong><small>{refreshedAt ? `Updated ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(refreshedAt)}` : 'Monthly paid revenue'}</small></span></div>
        </section>

        {error && <div className="error-banner" role="alert"><span><strong>Couldn’t load live data.</strong> {error}</span><button onClick={refresh}>Try again <Icon name="arrow" size={15} /></button></div>}

        <section className="stats-grid" aria-label="Key metrics">
          <Reveal delay={0}><StatCard icon="bars" label="Total revenue" value={stats ? preciseCurrency.format(Number(stats.total_revenue)) : '—'} note="Paid orders only" tone="mint" loading={loading && !stats} /></Reveal>
          <Reveal delay={55}><StatCard icon="receipt" label="Total orders" value={stats ? number.format(stats.total_orders) : '—'} note={stats ? `${number.format(stats.paid_orders)} paid orders` : 'All order statuses'} tone="blue" loading={loading && !stats} /></Reveal>
          <Reveal delay={110}><StatCard icon="chart" label="Avg. paid order" value={stats ? preciseCurrency.format(Number(stats.average_paid_order_value)) : '—'} note="Per paid order" tone="gold" loading={loading && !stats} /></Reveal>
          <Reveal delay={165}><StatCard icon="box" label="Low stock" value={stats ? number.format(stats.low_stock_products) : '—'} note="5 units or fewer" tone="rose" loading={loading && !stats} /></Reveal>
        </section>

        <section className="analytics-grid" id="performance">
          <Reveal delay={25}><article className="panel sales-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">REVENUE OVER TIME</p><h2>Sales performance</h2></div>
              <span className="chart-legend"><i /> Paid revenue</span>
            </div>
            <SalesChart rows={dashboard?.sales} loading={loading && !dashboard} />
          </article></Reveal>
          <Reveal delay={95}><article className="panel category-panel">
              <div className="panel-heading"><div><p className="eyebrow">BY CATEGORY</p><h2>Revenue mix</h2></div><span className="section-tag">Paid revenue</span></div>
            <DonutChart categories={dashboard?.categories} loading={loading && !dashboard} />
          </article></Reveal>
        </section>

        <section className="bottom-grid">
          <Reveal delay={20}><article className="panel products-panel" id="products">
            <div className="panel-heading">
              <div><p className="eyebrow">PRODUCT PERFORMANCE</p><h2>Top products</h2></div>
              <span className="section-tag">By units sold</span>
            </div>
            <ProductTable products={dashboard?.products} loading={loading && !dashboard} />
          </article></Reveal>
          <Reveal delay={90}><ActivityPanel mode={activityMode} onModeChange={setActivityMode} orders={dashboard?.orders} customers={dashboard?.customers} loading={loading && !dashboard} /></Reveal>
        </section>

        <footer className="page-footer"><span>DataScope <span className="footer-dot">·</span> Business analytics</span><span>{refreshedAt ? `Data refreshed ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(refreshedAt)}` : 'Connected to your store data'}</span></footer>
      </div>}
    </main>
    {accountPanel && <AccountModal key={accountPanel} panel={accountPanel} user={user} onClose={() => setAccountPanel(null)} onUpdated={setUser} />}
  </div>;
}
