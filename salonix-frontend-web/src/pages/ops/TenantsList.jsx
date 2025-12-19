import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useOpsTenants } from '../../hooks/useOpsTenants';
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const TenantsList = () => {
  const { listTenants, loading } = useOpsTenants();
  const [tenants, setTenants] = useState([]);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plan_tier: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchTenants = useCallback(async () => {
    try {
      // Use DRF PageNumberPagination params
      const params = {
        page,
        page_size: pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.is_active = filters.status === 'active';
      if (filters.plan_tier) params.plan_tier = filters.plan_tier;

      const data = await listTenants(params);
      setTenants(data.results);
      setCount(data.count);
    } catch (err) {
      console.error(err);
    }
  }, [page, pageSize, filters, listTenants]);

  useEffect(() => {
    // Debounce search could be added here, but for simplicity we rely on manual search or quick effect
    const timeoutId = setTimeout(() => {
      fetchTenants();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchTenants]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by useEffect when filters change
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Tenants</h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setPage(1);
              }}
            />
          </div>

          <select
            className="bg-gray-700 border border-gray-600 rounded-md text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filters.status}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>

          <select
            className="bg-gray-700 border border-gray-600 rounded-md text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filters.plan_tier}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, plan_tier: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">Todos os Planos</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </form>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading && tenants.length === 0 ? (
          <div className="text-center text-gray-400 py-10">Carregando...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            Nenhum tenant encontrado.
          </div>
        ) : (
          tenants.map((tenant) => (
            <Link
              key={tenant.id}
              to={`/ops/tenants/${tenant.id}`}
              className="block bg-gray-800 p-4 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {tenant.name}
                  </h3>
                  <p className="text-sm text-gray-400">{tenant.slug}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full 
                  ${tenant.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}
                >
                  {tenant.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full 
                  ${
                    tenant.plan_tier === 'enterprise'
                      ? 'bg-purple-900 text-purple-200'
                      : tenant.plan_tier === 'pro'
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {tenant.plan_tier.toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nome / Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading && tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Nenhum tenant encontrado.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {tenant.name}
                      </div>
                      <div className="text-sm text-gray-400">{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          tenant.plan_tier === 'enterprise'
                            ? 'bg-purple-900 text-purple-200'
                            : tenant.plan_tier === 'pro'
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {tenant.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${tenant.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}
                      >
                        {tenant.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/ops/tenants/${tenant.id}`}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Mostrando{' '}
              <span className="font-medium">
                {tenants.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(page * pageSize, count)}
              </span>{' '}
              de <span className="font-medium">{count}</span>
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-md ${page === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  setPage((p) => (p * pageSize < count ? p + 1 : p))
                }
                disabled={page * pageSize >= count}
                className={`p-2 rounded-md ${page * pageSize >= count ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantsList;
