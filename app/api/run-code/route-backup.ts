import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, language, testCases } = await request.json()
    
    if (!code || !testCases || !Array.isArray(testCases)) {
      return NextResponse.json(
        { error: 'Code and test cases are required' },
        { status: 400 }
      )
    }

    console.log('🧪 Running tests for code:', code.substring(0, 100) + '...')
    console.log('🧪 Test cases:', testCases.length)

    const results = []

    try {
      // Create a safe evaluation environment
      const safeGlobal = {
        console: {
          log: (...args: any[]) => console.log('User code:', ...args)
        },
        Math,
        parseInt,
        parseFloat,
        JSON,
        Array,
        Object,
        String,
        Number
      }

      // Execute the user code in a controlled environment
      const codeToExecute = `
        ${code}
        
        // Export the main function
        let mainFunction;
        if (typeof twoSum !== 'undefined') {
          mainFunction = twoSum;
        } else if (typeof solution !== 'undefined') {
          mainFunction = solution;
        } else if (typeof isPalindrome !== 'undefined') {
          mainFunction = isPalindrome;
        } else if (typeof fizzBuzz !== 'undefined') {
          mainFunction = fizzBuzz;
        } else if (typeof reverseString !== 'undefined') {
          mainFunction = reverseString;
        } else {
          // Try to find any function in the code
          const functionMatch = code.match(/function\\s+(\\w+)\\s*\\(/);
          if (functionMatch) {
            mainFunction = eval(functionMatch[1]);
          }
        }
        
        mainFunction;
      `

      // Use Function constructor for safer evaluation
      const func = new Function('console', 'Math', 'parseInt', 'parseFloat', 'JSON', 'Array', 'Object', 'String', 'Number', `return (${codeToExecute})`)
      const userFunction = func(safeGlobal.console, safeGlobal.Math, safeGlobal.parseInt, safeGlobal.parseFloat, safeGlobal.JSON, safeGlobal.Array, safeGlobal.Object, safeGlobal.String, safeGlobal.Number)

      if (typeof userFunction !== 'function') {
        return NextResponse.json([{
          name: 'Function Detection',
          passed: false,
          expected: 'A valid function',
          actual: 'No function found',
          error: 'No function detected in the code. Make sure to define a function like twoSum, solution, etc.'
        }])
      }

      // Run each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        
        try {
          let actualResult
          let expectedResult

          // Parse different input formats
          if (testCase.input.includes('target:')) {
            // Handle Two Sum format: [2,7,11,15] target: 9
            const [arrayPart, targetPart] = testCase.input.split('target:')
            const nums = JSON.parse(arrayPart.trim())
            const target = parseInt(targetPart.trim())
            actualResult = userFunction(nums, target)
          } else if (testCase.input.startsWith('[') && testCase.input.includes('],')) {
            // Handle multiple array inputs
            const inputs = testCase.input.split('],').map((part, index, arr) => {
              if (index < arr.length - 1) {
                return JSON.parse(part + ']')
              } else {
                return JSON.parse(part)
              }
            })
            actualResult = userFunction(...inputs)
          } else if (testCase.input.startsWith('[')) {
            // Handle single array input
            const inputArray = JSON.parse(testCase.input)
            actualResult = userFunction(inputArray)
          } else if (testCase.input.startsWith('"')) {
            // Handle string input
            const inputString = JSON.parse(testCase.input)
            actualResult = userFunction(inputString)
          } else {
            // Handle numeric or other simple inputs
            const numericInput = parseFloat(testCase.input)
            if (!isNaN(numericInput)) {
              actualResult = userFunction(numericInput)
            } else {
              actualResult = userFunction(testCase.input)
            }
          }

          expectedResult = JSON.parse(testCase.expectedOutput)

          // Compare results (arrays need special handling)
          let passed = false
          if (Array.isArray(actualResult) && Array.isArray(expectedResult)) {
            // For arrays, sort both before comparing (for problems like Two Sum where order might vary)
            if (actualResult.length === expectedResult.length) {
              const sortedActual = [...actualResult].sort((a, b) => a - b)
              const sortedExpected = [...expectedResult].sort((a, b) => a - b)
              passed = JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
            }
          } else {
            passed = JSON.stringify(actualResult) === JSON.stringify(expectedResult)
          }

          results.push({
            name: testCase.description || `Test Case ${i + 1}`,
            passed,
            expected: JSON.stringify(expectedResult),
            actual: JSON.stringify(actualResult)
          })

        } catch (error) {
          results.push({
            name: testCase.description || `Test Case ${i + 1}`,
            passed: false,
            expected: testCase.expectedOutput,
            actual: 'Runtime Error',
            error: (error as Error).message
          })
        }
      }

      console.log('🧪 Test results:', results)
      return NextResponse.json(results)

    } catch (error) {
      console.error('🧪 Code execution error:', error)
      return NextResponse.json([{
        name: 'Code Execution',
        passed: false,
        expected: 'Valid code execution',
        actual: 'Execution failed',
        error: (error as Error).message
      }])
    }

  } catch (error) {
    console.error('🧪 API error:', error)
    return NextResponse.json(
      { error: 'Failed to run tests' },
      { status: 500 }
    )
  }
}