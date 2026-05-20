import client from './client';

export async function fetchCmsPages() {
  const response = await client.get('cms/pages/');
  return response.data;
}

export async function fetchCmsPage(slug) {
  const response = await client.get(`cms/pages/${slug}/`);
  return response.data;
}

export async function fetchRoadmap() {
  const response = await client.get('cms/roadmap/');
  return response.data;
}

export default { fetchCmsPages, fetchCmsPage, fetchRoadmap };
