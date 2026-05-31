import org.gradle.testing.jacoco.plugins.JacocoTaskExtension
import org.gradle.testing.jacoco.tasks.JacocoReport

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
    jacoco
}

android {
    namespace = "com.wealthstack.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.wealthstack.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/\"")
    }

    buildTypes {
        debug {
            enableUnitTestCoverage = true
        }
        release {
            isMinifyEnabled = false
            buildConfigField("String", "API_BASE_URL", "\"https://api.example.com/\"")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_23
        targetCompatibility = JavaVersion.VERSION_23
    }

    kotlinOptions {
        jvmTarget = "23"
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.retrofit)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.codegen)
    implementation(libs.datastore.preferences)
    implementation(libs.kotlinx.coroutines.android)
    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.mockk)
    testImplementation(libs.androidx.arch.core.testing)
    testImplementation(libs.okhttp.mockwebserver)
}

tasks.withType<Test>().configureEach {
    extensions.configure(JacocoTaskExtension::class.java) {
        isIncludeNoLocationClasses = true
        excludes = listOf("jdk.internal.*")
    }
}

tasks.register<JacocoReport>("jacocoTestReport") {
    group = "verification"
    description = "Generates JaCoCo XML and HTML coverage reports for SonarCloud."
    dependsOn("testDebugUnitTest")

    reports {
        xml.required.set(true)
        xml.outputLocation.set(
            layout.buildDirectory.file("reports/jacoco/jacocoTestReport/jacocoTestReport.xml"),
        )
        html.required.set(true)
    }

    val coverageExcludes = listOf(
        "**/R.class",
        "**/R\$*.class",
        "**/BuildConfig.*",
        "**/Manifest*.*",
        "**/*Test*.*",
        "**/*\$Lambda\$*.*",
        "**/*\$inlined\$*.*",
        "**/Hilt_*.*",
        "**/*_Factory.*",
        "**/*_MembersInjector.*",
        "**/*Module_*.*",
        "**/Dagger*.*",
        "**/*Hilt*.*",
        "**/di/**",
        "**/*ComposableSingletons*.*",
    )

    val kotlinClasses = fileTree("${layout.buildDirectory.get()}/tmp/kotlin-classes/debug") {
        exclude(coverageExcludes)
    }
    val javaClasses = fileTree(
        "${layout.buildDirectory.get()}/intermediates/javac/debug/compileDebugJavaWithJavac/classes",
    ) {
        exclude(coverageExcludes)
    }

    classDirectories.setFrom(files(kotlinClasses, javaClasses))
    sourceDirectories.setFrom(files("src/main/java"))
    executionData.setFrom(
        fileTree(layout.buildDirectory.get()) {
            include("outputs/unit_test_code_coverage/debugUnitTest/testDebugUnitTest.exec")
        },
    )
}
