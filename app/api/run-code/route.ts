import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

interface TestCase {
  input: string
  expectedOutput: string
  description?: string
}

interface TestResult {
  name: string
  passed: boolean
  expected: string
  actual: string
  error?: string
}

// JavaScript execution (current implementation)
function executeJavaScript(code: string, testCases: TestCase[]): TestResult[] {
  const results: TestResult[] = []
  
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
    const wrappedCode = `
      (function() {
        ${code}
        
        // Return the main function
        if (typeof twoSum !== 'undefined') {
          return twoSum;
        } else if (typeof solution !== 'undefined') {
          return solution;
        } else if (typeof isPalindrome !== 'undefined') {
          return isPalindrome;
        } else if (typeof fizzBuzz !== 'undefined') {
          return fizzBuzz;
        } else if (typeof reverseString !== 'undefined') {
          return reverseString;
        } else {
          // Try to find any function in the code
          const functionMatch = \`${code.replace(/`/g, '\\`')}\`.match(/function\\s+(\\w+)\\s*\\(/);
          if (functionMatch) {
            return eval(functionMatch[1]);
          }
        }
        return null;
      })()
    `

    // Use Function constructor for safer evaluation
    const func = new Function('console', 'Math', 'parseInt', 'parseFloat', 'JSON', 'Array', 'Object', 'String', 'Number', `return ${wrappedCode}`)
    const userFunction = func(safeGlobal.console, safeGlobal.Math, safeGlobal.parseInt, safeGlobal.parseFloat, safeGlobal.JSON, safeGlobal.Array, safeGlobal.Object, safeGlobal.String, safeGlobal.Number)

    if (typeof userFunction !== 'function') {
      return [{
        name: 'Function Detection',
        passed: false,
        expected: 'A valid function',
        actual: 'No function found',
        error: 'No function detected in the code. Make sure to define a function like twoSum, solution, etc.'
      }]
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

    return results

  } catch (error) {
    console.error('JavaScript execution error:', error)
    return [{
      name: 'Code Execution',
      passed: false,
      expected: 'Valid code execution',
      actual: 'Execution failed',
      error: (error as Error).message
    }]
  }
}

// Python execution using child process
async function executePython(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const results: TestResult[] = []
    
    try {
      // Create temporary directory for Python execution
      const tempDir = mkdtempSync(join(tmpdir(), 'python-exec-'))
      const pythonFile = join(tempDir, 'solution.py')
      
      // Write Python code to file
      writeFileSync(pythonFile, code)
      
      let completedTests = 0
      
      // Process each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        
        // Create test script for this specific test case
        const testScript = `
import sys
import json
import os
sys.path.append('${tempDir.replace(/\\\\/g, '/')}')

try:
    # Import all functions from solution
    exec(open('${pythonFile.replace(/\\\\/g, '/')}').read())
    
    # Parse input
    input_str = '''${testCase.input}'''
    expected_str = '''${testCase.expectedOutput}'''
    
    result = None
    
    if 'target:' in input_str:
        # Handle Two Sum format
        array_part, target_part = input_str.split('target:')
        nums = json.loads(array_part.strip())
        target = int(target_part.strip())
        
        # Try different function names
        if 'twoSum' in globals():
            result = twoSum(nums, target)
        elif 'two_sum' in globals():
            result = two_sum(nums, target)
        elif 'solution' in globals():
            result = solution(nums, target)
        else:
            raise Exception("No twoSum, two_sum, or solution function found")
            
    elif input_str.startswith('['):
        # Handle array input
        input_data = json.loads(input_str)
        
        if 'solution' in globals():
            result = solution(input_data)
        elif 'isPalindrome' in globals():
            result = isPalindrome(input_data)
        elif 'is_palindrome' in globals():
            result = is_palindrome(input_data)
        else:
            # Try to find any function that takes one parameter
            for name in dir():
                if not name.startswith('_') and callable(globals()[name]):
                    try:
                        result = globals()[name](input_data)
                        break
                    except:
                        continue
                        
    elif input_str.startswith('"'):
        # Handle string input
        input_data = json.loads(input_str)
        
        if 'solution' in globals():
            result = solution(input_data)
        elif 'reverseString' in globals():
            result = reverseString(input_data)
        elif 'reverse_string' in globals():
            result = reverse_string(input_data)
        else:
            for name in dir():
                if not name.startswith('_') and callable(globals()[name]):
                    try:
                        result = globals()[name](input_data)
                        break
                    except:
                        continue
                        
    else:
        # Handle numeric input
        try:
            input_data = float(input_str)
            if input_data.is_integer():
                input_data = int(input_data)
        except:
            input_data = input_str
            
        if 'solution' in globals():
            result = solution(input_data)
        else:
            for name in dir():
                if not name.startswith('_') and callable(globals()[name]):
                    try:
                        result = globals()[name](input_data)
                        break
                    except:
                        continue
    
    expected = json.loads(expected_str)
    
    # Compare results
    if isinstance(result, list) and isinstance(expected, list):
        # For arrays, try both exact and sorted comparison
        passed = result == expected or sorted(result) == sorted(expected)
    else:
        passed = result == expected
    
    print(json.dumps({
        "result": result, 
        "expected": expected, 
        "passed": passed,
        "actual": json.dumps(result),
        "expectedJson": json.dumps(expected)
    }))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`
        
        const testFile = join(tempDir, `test_${i}.py`)
        writeFileSync(testFile, testScript)
        
        // Execute the test
        const python = spawn('python', [testFile], {
          cwd: tempDir,
          timeout: 10000 // 10 second timeout
        })
        
        let output = ''
        let errorOutput = ''
        
        python.stdout.on('data', (data) => {
          output += data.toString()
        })
        
        python.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })
        
        python.on('close', (code) => {
          try {
            if (output.trim()) {
              const testResult = JSON.parse(output.trim())
              if (testResult.error) {
                results.push({
                  name: testCase.description || `Test Case ${i + 1}`,
                  passed: false,
                  expected: testCase.expectedOutput,
                  actual: 'Runtime Error',
                  error: testResult.error
                })
              } else {
                results.push({
                  name: testCase.description || `Test Case ${i + 1}`,
                  passed: testResult.passed,
                  expected: testResult.expectedJson,
                  actual: testResult.actual
                })
              }
            } else {
              results.push({
                name: testCase.description || `Test Case ${i + 1}`,
                passed: false,
                expected: testCase.expectedOutput,
                actual: 'No Output',
                error: errorOutput || `Python execution failed with exit code ${code}`
              })
            }
          } catch (parseError) {
            results.push({
              name: testCase.description || `Test Case ${i + 1}`,
              passed: false,
              expected: testCase.expectedOutput,
              actual: 'Parse Error',
              error: 'Failed to parse Python output: ' + output
            })
          }
          
          completedTests++
          if (completedTests === testCases.length) {
            // Cleanup temporary files
            try {
              unlinkSync(pythonFile)
              for (let j = 0; j < testCases.length; j++) {
                try { 
                  unlinkSync(join(tempDir, `test_${j}.py`)) 
                } catch {}
              }
            } catch {}
            resolve(results)
          }
        })
        
        python.on('error', (error) => {
          results.push({
            name: testCase.description || `Test Case ${i + 1}`,
            passed: false,
            expected: testCase.expectedOutput,
            actual: 'Execution Error',
            error: 'Python not available: ' + error.message
          })
          
          completedTests++
          if (completedTests === testCases.length) {
            resolve(results)
          }
        })
      }
      
    } catch (error) {
      resolve([{
        name: 'Python Setup',
        passed: false,
        expected: 'Successful setup',
        actual: 'Setup Error',
        error: (error as Error).message
      }])
    }
  })
}

// Placeholder for other languages
async function executeJava(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  return [{
    name: 'Java Execution',
    passed: false,
    expected: 'Java support',
    actual: 'Not Implemented',
    error: 'Java execution is not yet implemented. Please use JavaScript or Python for now.'
  }]
}

async function executeCpp(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  return [{
    name: 'C++ Execution',
    passed: false,
    expected: 'C++ support',
    actual: 'Not Implemented',
    error: 'C++ execution is not yet implemented. Please use JavaScript or Python for now.'
  }]
}

async function executeTypeScript(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  // For now, treat TypeScript as JavaScript (basic support)
  return executeJavaScript(code, testCases)
}

export async function POST(request: NextRequest) {
  try {
    const { code, language, testCases } = await request.json()
    
    if (!code || !testCases || !Array.isArray(testCases)) {
      return NextResponse.json(
        { error: 'Code and test cases are required' },
        { status: 400 }
      )
    }

    console.log('🧪 Running tests for language:', language)
    console.log('🧪 Code length:', code.length, 'characters')
    console.log('🧪 Test cases:', testCases.length)

    let results: TestResult[] = []

    // Execute based on language
    const lang = language?.toLowerCase() || 'javascript'
    
    switch (lang) {
      case 'javascript':
      case 'js':
        console.log('🟨 Executing JavaScript code...')
        results = executeJavaScript(code, testCases)
        break
        
      case 'python':
      case 'py':
        console.log('🐍 Executing Python code...')
        results = await executePython(code, testCases)
        break
        
      case 'java':
        console.log('☕ Executing Java code...')
        results = await executeJava(code, testCases)
        break
        
      case 'cpp':
      case 'c++':
        console.log('⚡ Executing C++ code...')
        results = await executeCpp(code, testCases)
        break
        
      case 'typescript':
      case 'ts':
        console.log('🔷 Executing TypeScript code...')
        results = await executeTypeScript(code, testCases)
        break
        
      default:
        console.warn('❓ Unknown language, defaulting to JavaScript:', language)
        results = executeJavaScript(code, testCases)
        break
    }

    console.log('✅ Test execution completed. Results:', results.map(r => ({ 
      name: r.name, 
      passed: r.passed,
      error: r.error ? r.error.substring(0, 100) : undefined
    })))
    
    return NextResponse.json(results)

  } catch (error) {
    console.error('❌ Unexpected error during test execution:', error)
    return NextResponse.json(
      [{ 
        name: 'System Error',
        passed: false,
        expected: 'Successful execution',
        actual: 'System Error',
        error: (error as Error).message
      }],
      { status: 500 }
    )
  }
}