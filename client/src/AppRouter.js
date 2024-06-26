import React from 'react';
import { HashRouter  as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import AboutMe from './pages/AboutMe/AboutMe';
import Publications from './pages/Publications/Publications'
import Team from './pages/Team/Team'
import ContactUs from './pages/ContactUs/ContactUs';
import News from './pages/News/News';
import NotFound from './pages/NotFound/NotFound';
import Login from './pages/Login/Login';
import AdminDashboard from './pages/Admin/AdminDashboard'
import AuthRoute from './utils/AuthRoute';
import ForgotPassword from './pages/Login/ForgotPassword'
import ResetPassword from './pages/Login/ResetPassword'
import ContentPage from './pages/ContentPage/ContentPage'; 

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/AboutMe" element={<AboutMe />} />
      <Route path="/Publications" element={<Publications />} />
      <Route path="/Team" element={<Team />} />
      <Route path="/ContactUs" element={<ContactUs />} />
      <Route path="/News&Resources" element={<News />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/ResetPassword" element={<ResetPassword />} />
      <Route path="/AdminDashboard" element={ <AuthRoute> <AdminDashboard /> </AuthRoute>} />
      <Route path="/content-page" element={<ContentPage />} /> 
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default AppRouter;
