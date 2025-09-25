# Linear Equations and Correlation Coefficients

This document provides an overview of linear equations for lines, including their definition and calculation methods. It also covers the correlation coefficient, explaining what it measures and how to compute it. Examples are included for clarity.

## Linear Equation of a Line

### What is a Linear Equation?
A linear equation represents a straight line on a two-dimensional plane. It describes the relationship between two variables, typically \(x\) (independent) and \(y\) (dependent), where the graph is a straight line. The general form is:

\[
y = mx + b
\]

- \(m\): The slope, which indicates the steepness and direction of the line (positive for upward, negative for downward).
- \(b\): The y-intercept, where the line crosses the y-axis (when \(x = 0\)).

Other forms include:
- **Point-slope form**: \(y - y_1 = m(x - x_1)\), useful when you know a point \((x_1, y_1)\) and the slope.
- **Standard form**: \(Ax + By = C\), where \(A\), \(B\), and \(C\) are constants.

Linear equations assume a constant rate of change, making them fundamental in algebra, graphing, and modeling real-world relationships like distance over time.

### How to Calculate a Linear Equation
To find the equation of a line, you typically need two points on the line or one point and the slope. Here's a step-by-step guide using two points \((x_1, y_1)\) and \((x_2, y_2)\):

1. **Calculate the slope (\(m\))**:
   \[
   m = \frac{y_2 - y_1}{x_2 - x_1}
   \]
   This measures the change in \(y\) per unit change in \(x\). If \(x_2 = x_1\), the line is vertical (undefined slope).

2. **Find the y-intercept (\(b\))**:
   Use one of the points and the slope in the slope-intercept form:
   \[
   b = y_1 - m \cdot x_1
   \]

3. **Write the equation**:
   Substitute \(m\) and \(b\) into \(y = mx + b\).

#### Example
Suppose we have points (2, 3) and (4, 7):

1. Slope: \(m = \frac{7 - 3}{4 - 2} = \frac{4}{2} = 2\)
2. Y-intercept: \(b = 3 - 2 \cdot 2 = 3 - 4 = -1\)
3. Equation: \(y = 2x - 1\)

To verify, plug in the second point: \(y = 2 \cdot 4 - 1 = 8 - 1 = 7\) (matches).

## Correlation Coefficient

### What is a Correlation Coefficient?
The correlation coefficient, often denoted as \(r\) (Pearson's correlation coefficient), measures the strength and direction of the linear relationship between two continuous variables. It ranges from -1 to 1:

- \(r = 1\): Perfect positive linear correlation (as one variable increases, the other increases proportionally).
- \(r = -1\): Perfect negative linear correlation (as one increases, the other decreases proportionally).
- \(r = 0\): No linear correlation (variables are independent or have a non-linear relationship).
- Values between 0 and 1 (or -1 and 0) indicate varying degrees of correlation strength.

It does not imply causation—only association. It's commonly used in statistics for data analysis, such as in scatter plots to assess how well a line fits the data.

Note: This assumes a linear relationship; for non-linear data, other measures like Spearman's rank correlation might be better.

### How to Calculate the Correlation Coefficient
The formula for Pearson's \(r\) for a dataset with \(n\) pairs \((x_i, y_i)\) is:

\[
r = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n} (x_i - \bar{x})^2 \cdot \sum_{i=1}^{n} (y_i - \bar{y})^2}}
\]

Where:
- \(\bar{x}\): Mean of \(x\) values (\(\bar{x} = \frac{\sum x_i}{n}\)).
- \(\bar{y}\): Mean of \(y\) values.

Steps:

1. **Calculate means**: Find \(\bar{x}\) and \(\bar{y}\).
2. **Compute deviations**: For each pair, calculate \((x_i - \bar{x})\) and \((y_i - \bar{y})\).
3. **Numerator**: Sum the products of deviations: \(\sum (x_i - \bar{x})(y_i - \bar{y})\).
4. **Denominator**: Square root of the product of summed squared deviations for \(x\) and \(y\).
5. **Divide**: Numerator by denominator to get \(r\).

#### Example
Dataset: (1, 2), (2, 3), (3, 5), (4, 4). So \(n = 4\).

1. Means: \(\bar{x} = \frac{1+2+3+4}{4} = 2.5\), \(\bar{y} = \frac{2+3+5+4}{4} = 3.5\).
2. Deviations:
   - For (1,2): \(x- \bar{x} = -1.5\), \(y- \bar{y} = -1.5\)
   - (2,3): -0.5, -0.5
   - (3,5): 0.5, 1.5
   - (4,4): 1.5, 0.5
3. Products: (-1.5)(-1.5) = 2.25, (-0.5)(-0.5) = 0.25, (0.5)(1.5) = 0.75, (1.5)(0.5) = 0.75. Sum = 4.
4. Squared deviations:
   - \(x\): (-1.5)^2 + (-0.5)^2 + (0.5)^2 + (1.5)^2 = 2.25 + 0.25 + 0.25 + 2.25 = 5
   - \(y\): (-1.5)^2 + (-0.5)^2 + (1.5)^2 + (0.5)^2 = 2.25 + 0.25 + 2.25 + 0.25 = 5
   - Denominator: \(\sqrt{5 \cdot 5} = \sqrt{25} = 5\)
5. \(r = 4 / 5 = 0.8\) (strong positive correlation).