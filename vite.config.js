import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        services: "services.html",
        materials: "materials.html",
        howItWorks: "how-it-works.html",
        gallery: "gallery.html",
        contacts: "contacts.html",
        login: "app/login.html",
        register: "app/register.html",
        dashboard: "app/dashboard.html",
        upload: "app/upload.html",
        requests: "app/requests.html",
        profile: "app/profile.html",
        admin: "admin-panel/admin.html",
        adminUsers: "admin-panel/admin-users.html",
        adminInquiries: "admin-panel/admin-inquiries.html",
        adminOrders: "admin-panel/admin-orders.html",
        adminMaterials: "admin-panel/admin-materials.html",
        adminCms: "admin-panel/admin-cms.html",
        pagesIndex: "pages/index.html",
        pagesServices: "pages/services.html",
        pagesMaterials: "pages/materials.html",
        pagesHowItWorks: "pages/how-it-works.html",
        pagesGallery: "pages/gallery.html",
        pagesContacts: "pages/contacts.html"
      }
    }
  }
});
