<QueryClientProvider>
  <Router>
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && <GV_TopNav />}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          {/* Protected Routes */}
        </Routes>
      </main>
      <GV_Footer />
    </div>
    <GV_Modals />
    <GV_ToastNotifications />
  </Router>
</QueryClientProvider>