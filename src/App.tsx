import { Route, Routes } from 'react-router-dom';

import { ListPage } from '@/pages/ListPage';
import { DetailPage } from '@/pages/DetailPage';
import { FormPage } from '@/pages/FormPage';

export function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/coupon/new" element={<FormPage key="new" />} />
        <Route path="/coupon/:id" element={<DetailPage />} />
        <Route path="/coupon/:id/edit" element={<FormPage key="edit" />} />
      </Routes>
    </div>
  );
}
