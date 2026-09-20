# Announcing enrollcast

Published

2026-09-20

I am excited to announce the first CRAN release of [enrollcast](https://CRAN.R-project.org/package=enrollcast). This package formalizes the commonly used cohort survival (or grade progression ratio) method of school enrollment forecasting. It is implemented as a matrix projection inspired by the [Leslie matrix](https://en.wikipedia.org/wiki/Leslie_matrix) model of population growth. The package can be used to project enrollment at any level of aggregation for arbitrary grade combinations and time spans.

## Installation

``` r
install.packages("enrollcast")
```

## Usage

At its most basic, users are required to supply a data.frame of historical grade-level enrollment and future entry grade enrollment.

The example below defines a data.frame containing Kindergarten to 2nd grade enrollment for the years 2021, 2022 and 2023. The historical enrollment is the input to `progression_ratios()` which calculates grade progression ratios for each grade transition. The matrix output is passed to `project_enrollment()` along with the base year of enrollment (the final year of our historical enrollment in this example), the projection horizon and estimates of entry grade enrollment.

``` r
library(enrollcast)

# A data.frame of historical grade-level enrollment
# Observations are enrollment for a single grade in a school year
history <- data.frame(
  year = rep(2021:2023, each = 3),
  grade = factor(rep(c("K", "1", "2"), 3), levels = c("K", "1", "2")),
  enrollment = c(100, 90, 80, 110, 95, 88, 120, 99, 91)
)

# 1. Calculate progression ratios.
ratios <- progression_ratios(history, method = "mean")
ratios
```

      grade_from grade_to     ratio
    1          K        1 0.9250000
    2          1        2 0.9678363

``` r
# 2. Project forward. The entry grade (K) is supplied exogenously.
base <- history[history$year == 2023, c("grade", "enrollment")]
projection <- project_enrollment(
  base = base,
  ratios = ratios,
  horizon = 3,
  entry = c(125, 130, 128),
  start_year = 2023
)
projection
```

      year grade enrollment
    1 2024     K  125.00000
    2 2024     1  111.00000
    3 2024     2   95.81579
    4 2025     K  130.00000
    5 2025     1  115.62500
    6 2025     2  107.42982
    7 2026     K  128.00000
    8 2026     1  120.25000
    9 2026     2  111.90607

[See the documentation](https://localopen.github.io/enrollcast/) for a comprehensive overview of the package, including the `swing_schedule()` function which allows users to construct an enrollment schedule for schools that temporarily relocate (or face another kind of enrollment disruption) during the projection period.

## LLM disclosure

While the idea was mine, I made heavy use of LLMs to write the package. As a solo package “author”, having these tools at hand was helpful to get through the early stages of development. Now that the hard part is complete, I intend to take a more active role in actually writing code, although I still intend to use LLMs to assist with this.

## Acknowledgements

The [hex logo](https://localopen.github.io/enrollcast/logo.svg) for this package was created by Adam Higerd, for which I’m endlessly grateful.
