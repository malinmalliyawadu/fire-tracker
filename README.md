# 🔥 FIRE Tracker

A comprehensive Financial Independence, Retire Early (FIRE) calculator and tracker built with React, TypeScript, and modern web technologies.

## Features

### 📊 Financial Tracking
- **Asset Management**: Track stocks, crypto, KiwiSaver, savings accounts, and more
- **Liability Tracking**: Monitor mortgages, loans, and other debts
- **Multi-Currency Support**: Handle NZD and USD assets with automatic conversion
- **Real-time Calculations**: Dynamic FIRE number calculation based on your withdrawal rate

### 🎯 FIRE Calculations
- **Traditional FIRE**: Calculate your standard FIRE target
- **Lean FIRE**: 60% of your FIRE target for minimal expenses
- **Fat FIRE**: 150% of your FIRE target for comfortable retirement
- **Coast FIRE**: Amount needed today to reach FIRE by retirement age
- **Time to FIRE**: Calculate years remaining based on current contributions

### 📈 Projections & Charts
- **Interactive Charts**: Visualize your journey to FIRE with detailed projections
- **Advanced Filtering**: Filter charts by asset types, liability types, or specific assets
- **Debt Scenarios**: Accurate modeling of debt payoff with proper interest rates
- **Retirement Phase**: Model withdrawal phase with configurable rates

### ⚙️ Advanced Features
- **Payment Frequencies**: Support for weekly, fortnightly, monthly, quarterly, and annual contributions
- **Realistic Modeling**: Separate interest rates for debts vs investment returns
- **Currency Conversion**: Automatic conversion between supported currencies
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: HeroUI (NextUI successor)
- **Styling**: TailwindCSS
- **State Management**: Zustand with localStorage persistence
- **Charts**: Recharts
- **Testing**: Vitest with jsdom
- **Development**: ESLint, Prettier, Hot reload

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/malinmalliyawadu/fire-tracker.git
cd fire-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test            # Run unit tests
npm run test:ui     # Run tests with UI interface

# Linting
npm run lint        # Run ESLint with auto-fix
```

## Usage

1. **Set Your Goals**: Configure your FIRE target, withdrawal rate, and expected returns in Settings
2. **Add Assets**: Input your current investments, savings, and other assets
3. **Track Liabilities**: Add mortgages, loans, and debts with accurate interest rates
4. **Monitor Progress**: View your progress towards FIRE with real-time calculations
5. **Analyze Projections**: Use the Charts page to visualize different scenarios and filter data
6. **Plan Your Journey**: Adjust contributions and see how it affects your timeline

## Key Concepts

### FIRE Types
- **Traditional FIRE**: 25x annual expenses (4% withdrawal rule)
- **Lean FIRE**: Minimal expenses lifestyle (60% of traditional)
- **Fat FIRE**: Comfortable/luxury retirement (150% of traditional)
- **Coast FIRE**: Let compound interest do the work until retirement

### Financial Modeling
- **Debt Phase**: Uses actual liability interest rates for accurate projections
- **Savings Phase**: Applies investment returns once debts are paid off
- **Retirement Phase**: Models withdrawal period with optional contributions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

The project includes comprehensive unit tests covering:
- FIRE calculation algorithms
- Currency conversion utilities
- Chart filtering logic
- Financial projection modeling

Run tests with `npm test` or use the UI with `npm run test:ui`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [HeroUI](https://heroui.com/) component library
- Inspired by the FIRE movement and financial independence principles
- Charts powered by [Recharts](https://recharts.org/)

---

**Start your journey to financial independence today! 🎯**