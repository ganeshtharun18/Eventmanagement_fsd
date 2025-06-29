import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import AdminUsers from '../components/admin/AdminUsers';
import EnhancedAnalytics from '../components/admin/EnhancedAnalytics';
import BulkEventActions from '../components/admin/BulkEventActions';
import Announcements from '../components/admin/Announcements';
import ReportExport from '../components/admin/ReportExport';
import './AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <Tabs>
        <TabList>
          <Tab>User Management</Tab>
          <Tab>Event Analytics</Tab>
          <Tab>Bulk Actions</Tab>
          <Tab>Announcements</Tab>
          <Tab>Export Reports</Tab>
        </TabList>
        
        <TabPanel>
          <AdminUsers />
        </TabPanel>
        
        <TabPanel>
          <EnhancedAnalytics />
        </TabPanel>
        
        <TabPanel>
          <BulkEventActions />
        </TabPanel>
        
        <TabPanel>
          <Announcements />
        </TabPanel>
        
        <TabPanel>
          <ReportExport />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;