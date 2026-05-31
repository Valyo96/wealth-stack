package com.wealthstack.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.wealthstack.app.ui.navigation.WealthStackNavHost
import com.wealthstack.app.ui.theme.WealthStackTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            WealthStackTheme {
                WealthStackNavHost()
            }
        }
    }
}
