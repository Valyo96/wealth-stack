package com.wealthstack.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.wealthstack.app.ui.auth.LoginScreen
import com.wealthstack.app.ui.auth.LoginViewModel
import com.wealthstack.app.ui.dashboard.DashboardScreen
import com.wealthstack.app.ui.transactions.TransactionsScreen

@Composable
fun WealthStackNavHost(
    navController: NavHostController = rememberNavController(),
) {
    val loginViewModel: LoginViewModel = hiltViewModel()
    val isLoggedIn by loginViewModel.isLoggedIn.collectAsState(initial = false)
    val start = if (isLoggedIn) Routes.Dashboard else Routes.Login

    NavHost(navController = navController, startDestination = start) {
        composable(Routes.Login) {
            LoginScreen(
                viewModel = loginViewModel,
                onAuthenticated = {
                    navController.navigate(Routes.Dashboard) {
                        popUpTo(Routes.Login) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.Dashboard) {
            DashboardScreen(
                onOpenTransactions = { navController.navigate(Routes.Transactions) },
                onLogout = {
                    loginViewModel.logout()
                    navController.navigate(Routes.Login) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.Transactions) {
            TransactionsScreen(onBack = { navController.popBackStack() })
        }
    }
}
