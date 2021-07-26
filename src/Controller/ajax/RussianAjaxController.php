<?php
// src/Controller/RussianAjaxController.php
namespace App\Controller\ajax;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

use App\Controller\BaseController;
use App\Service\Base;

class RussianAjaxController extends BaseController
{


	/**
	* @Route("/ajax/russian-lab/search-word")
	*/
    public function searchWord(Base $connectionHub) : Response
    {

        $this->db = $connectionHub->dbNameRussianWords;

		$this->backgroundColour = '#1e90ff';
	    $this->backgroundImage = null;
	    $this->bodyBgClass = 'bg-dark';

		$data = '';

        if (isset($_GET["searchbyid"])) {
	    	if ($_GET["searchbyid"] === 'random') {
	    		$wordTypePrefix = rand(1,3);

	    		$randomId;

	    		if ($wordTypePrefix === 1) $randomId = rand(100001,110504);
	    		else if ($wordTypePrefix === 2) $randomId = rand(200001,215916);
	    		else if ($wordTypePrefix === 3) $randomId = rand(300001,309155);

	    		$data = $this->getWordFormsByIDs($connectionHub->con, $randomId);
	    	}
	    	else {
        		$data = $this->getWordFormsByIDs($connectionHub->con, $_GET["searchbyid"]);
        	}
        }
        else if (isset($_GET["searchword"])) {
        	$data = $this->searchByReducedSpelling($connectionHub->con, $_GET["searchword"]);
        }
        else if (isset($_GET["searchbyenglishwords"])) {
        	$data = $this->searchByEnglishWords($connectionHub->con, $_GET["searchbyenglishwords"]);
        }
        else if (isset($_GET["c1"]) && isset($_GET["c2"])) {
        	$data = $this->compareWordSimilarities($_GET["c1"], $_GET["c2"]);
        }

		return new Response($data);
    }

    private $db = null;

	public function retainOnlyCyrillic($input) {

		$charCount = mb_strlen($input, 'utf8');

		$sb = '';

		for ($i=0; $i<$charCount; $i++) {
			$nextChar =  mb_substr($input, $i, 1);
			if (('а' <= $nextChar && $nextChar <= 'я') || ('0' <= $nextChar && $nextChar <= '9') || $nextChar === 'ё') {
				$sb .= $nextChar;
			}
		}

		return $sb;
	}


	private function makeAllCyrillicConsonantsVoiced($input) {

		$charCount = mb_strlen($input, 'utf8');

		$sb = '';

		for ($i=0; $i<$charCount; $i++) {
			$nextChar =  mb_substr($input, $i, 1);

			switch ($nextChar) {
				case 'п': $sb .= 'б'; break;
				case 'ф': $sb .= 'в'; break;
				case 'к': $sb .= 'г'; break;
				case 'т': $sb .= 'д'; break;
				case 'ш': $sb .= 'ж'; break;
				case 'щ': $sb .= 'ж'; break;
				case 'с': $sb .= 'з'; break;
				case 'ц': $sb .= "дз"; break;
				case 'ч': $sb .= "дж"; break;
				default: $sb .= $nextChar; break;
			}
		}

		return $sb;
	}


	private function removeDoubleLetters($input) {

		$charCount = mb_strlen($input, 'utf8');

		$sb = '';

		$lastChar = ' ';

		for ($i=0; $i<$charCount; $i++) {
			$thisChar = mb_substr($input, $i, 1);

			if ($thisChar != $lastChar) {
				$sb .= $thisChar;
			}

			$lastChar = $thisChar;
		}

		return $sb;
	}



	private function removeSomeConsonantsAfterVowels($input) {

		$charCount = mb_strlen($input, 'utf8');

		$sb = '';

		$lastChar = ' ';

		for ($i=0; $i<$charCount; $i++) {
			$thisChar = mb_substr($input, $i, 1);
			$nextChar = $i==$charCount-1 ? ' ' : mb_substr($input, $i+1, 1);

			if ($thisChar === 'р' || $thisChar === 'л') {

				$lastCharIsVowel = false;
				$nextCharIsVowel = false;

				switch ($lastChar) {
					case 'а': case 'я':
					case 'э': case 'е':
					case 'ы': case 'и':
					case 'о': case 'ё':
					case 'у': case 'ю': $lastCharIsVowel = true;
				}

				switch ($nextChar) {
					case 'а': case 'я':
					case 'э': case 'е':
					case 'ы': case 'и':
					case 'о': case 'ё':
					case 'у': case 'ю': $nextCharIsVowel = true;
				}

				if ($lastCharIsVowel && !$nextCharIsVowel) {
					// Add nothing
				}
				else {
					$sb .= $thisChar;
				}
			}
			else {
				$sb .= $thisChar;
			}

			$lastChar = $thisChar;
		}

		return $sb;
	}

	private function removeNonConsonantsAndY($input) {
		$charCount = mb_strlen($input, 'utf8');

		$sb = '';

		mb_internal_encoding("UTF-8");

		for ($i=0; $i<$charCount; $i++) {
			$nextChar = mb_substr($input, $i, 1);

			switch ($nextChar) {
				case 'а': case 'э': case 'ы': case 'о': case 'у':
				case 'я': case 'е': case 'и': case 'ё': case 'ю':
				case 'ь': case 'ъ': case 'й': break;
				default: $sb .= $nextChar; break;
			}
		}

		return $sb;
	}

	public function reduceSpelling($input) {
			$newSpelling = $this->retainOnlyCyrillic(mb_strtolower($input));
			$newSpelling = $this->makeAllCyrillicConsonantsVoiced($newSpelling);
			$newSpelling = $this->removeDoubleLetters($newSpelling);
			$newSpelling = $this->removeSomeConsonantsAfterVowels($newSpelling);
			$newSpelling = $this->removeNonConsonantsAndY($newSpelling);
			return $newSpelling;
	}

	/*
	private function getVerbPartnerInfo($id) {
		"SELECT `i`.`id`, `wf`.`spelling`, `wf`.`stress_pos`, `i`.`aspect` FROM `VerbPartners` `p`"
		." JOIN `VerbsInfo` `i` ON  `p`.`verb_id`=`i`.`id`"
		." JOIN `WordForms` `wf` ON `p`.`verb_id`=`wf`.`word_id` AND `wf`.`dec_class`=\"infinitive\""
		." WHERE `verb_id`=$id OR  `verb_partner_id`=$id";
	}
	*/

	/**
		The ids here are given as a string with each id seperated by a comma.
	*/
	public function getWordFormsByIDs($con, $ids) {

		$con->select_db ($this->db);

		$q = "SELECT `a`.`dec_class`, `a`.`spelling` `spelling`, `a`.`stress_pos` `stress_pos`, `a`.`word_id` `word_id`, `w`.`type`,"
		." `i`.`english_words` `english_words`, `n`.`dec_type`, `n`.`gender`, `n`.`is_animate`, `v`.`aspect`"
		." FROM `WordForms` `a`"
		." JOIN `Words` `w` ON `w`.`id` = `a`.`word_id`"
		." JOIN `Information` `i` ON `a`.`word_id` = `i`.`id` AND (`a`.`word_id` = " . str_replace(',',' OR `a`.`word_id` = ',$ids) . ")"
		." LEFT JOIN `NounsInfo` `n` ON `n`.`id`=`w`.`id`"
		." LEFT JOIN `VerbsInfo` `v` ON `v`.`id`=`w`.`id`"
		." ORDER BY `a`.`word_id` ASC, `v`.`aspect` ASC";

		$result = $con->query($q);

		//echo $q; exit;

		$data = array();
		$resultsArray = null;
		$prevWordId = null;

		while ($row = mysqli_fetch_assoc($result)) {
			$currentWordId = $row['word_id'];
			if ($currentWordId !== $prevWordId) {
				array_push($data, array());
			}

			array_push($data[count($data)-1], $row);

			$prevWordId = $currentWordId;
		}

		$beforeJson = (object)['data' => $data];

		return json_encode($beforeJson, JSON_UNESCAPED_UNICODE);
	}

	public function searchByReducedSpelling($con, $searchWord) {
		$rSpelling = $this->reduceSpelling($searchWord);
		$searchWordLower = mb_strtolower($searchWord);

		$rSpellingCharCount = mb_strlen($rSpelling, 'utf8');
		$originalWordLength = mb_strlen($searchWord, 'utf8');
		$originalWordLengthMinus2 = $originalWordLength-2;
		$originalWordLengthMinus1 = $originalWordLength-1;
		$originalWordLengthPlus2 = $originalWordLength+2;
		$originalWordLengthPlus1 = $originalWordLength+1;


		$whereClause = "";

		if ($rSpellingCharCount < 3) {
			$whereClause = "AND `a`.`spelling_reduced` = '$rSpelling'";
		}
		else {
			//$whereClause .= " AND `a`.`spelling_reduced_length` =3 ";

			$whereClause .= "AND `a`.`spelling_reduced` IN ( ";

			$allConsonants = array('б','в','г','д','з','ж','л','м','н','р','х');
			$allConsonantsCount = count($allConsonants);

			for ($i=0; $i<$rSpellingCharCount; $i++) {

				$leftSide = mb_substr($rSpelling, 0, $i);
				$rightSide = mb_substr($rSpelling, $i+1);

				for ($j=0; $j<$allConsonantsCount; $j++) {
					if (!($i==0 && $j==0)) {
						$whereClause .= ',';
					}

					$whereClause .= "'";
					$whereClause .= $leftSide . $allConsonants[$j] . $rightSide;
					$whereClause .= "'";
				}
			}
			$whereClause .= ")";
		/*
			for ($i=0; $i<$rSpellingCharCount; $i++) {
				$whereClause .= $i==0 ? "WHERE" : " OR";
				$whereClause .= " `a`.`spelling_reduced` LIKE '";
				$whereClause .= mb_substr($rSpelling, 0, $i) . '_' . mb_substr($rSpelling, $i+1);
				$whereClause .= "'";
			}
			*/
		}


		$con->select_db ($this->db);

		$q = "SELECT `a`.`id` `id`, `a`.`dec_class`, `a`.`spelling` `spelling`, `a`.`stress_pos` `stress_pos`,"
		." `a`.`spelling_reduced`, `a`.`word_id`, `b`.`spelling` `dict_form_spelling`, `b`.`stress_pos` `dict_form_stress_pos`,"
		." `w`.`type`, `i`.`english_words` `english_words`, `v`.`verb_partner_id` `v_partner_id`, `vp`.`spelling` `v_partner_spelling`, `vp`.`stress_pos` `v_partner_stress_pos`,"
		." `vi`.`aspect` `aspect`, `vip`.`aspect` `v_partner_aspect`"
		." FROM `WordForms` `a`"
		." LEFT JOIN `NounsInfo` `n` ON `a`.`word_id`=`n`.`id`"
		." LEFT JOIN `VerbPartners` `v` ON `a`.`word_id`=`v`.`verb_id`"
		." LEFT JOIN `WordForms` `vp` ON `v`.`verb_partner_id`=`vp`.`word_id` AND `vp`.`dec_class`=\"infinitive\""
		." JOIN `WordForms` `b` ON (`b`.`dec_class`=\"infinitive\" OR `b`.`dec_class`=\"dec_nom_m\" OR (`b`.`dec_class`=\"dec_s_n\" AND `n`.`dec_type`!=\"p\") OR (`b`.`dec_class`=\"dec_p_n\" AND `n`.`dec_type`=\"p\")) AND `a`.`word_id` = `b`.`word_id`"
		." JOIN `Words` `w` ON `w`.`id` = `b`.`word_id`"
		." $whereClause"
		." LEFT JOIN `VerbsInfo` `vi` ON `a`.`word_id`=`vi`.`id`"
		." LEFT JOIN `VerbsInfo` `vip` ON `v`.`verb_partner_id`=`vip`.`id`"
		." JOIN `Information` `i` ON `a`.`word_id` = `i`.`id` ORDER BY `a`.`id` ASC";

		//echo $q;
		//exit;

		$result = $con->query($q);

		$resultsArray = array();

		while ($row = mysqli_fetch_assoc($result)) {
			array_push($resultsArray, $row);
		}

		$resultsArraySorted = array();

		$beforeJson;


		for ($i=0; $i<20; $i++) {

			$rowToMove = null;
			$highestSimilarity = -1;
			$rowIndex = -1;

			$resultsArrayCount = count($resultsArray);
			if ($resultsArrayCount == 0) break;

			$prevId = null;
			$prevRow = null;

			for ($resultI=0; $resultI < $resultsArrayCount; $resultI++) {

				$nextResult = $resultsArray[$resultI];

				if ($nextResult === null) {
					$prevId = null;
					continue;
				}

				$nextId = $nextResult['id'];
				//echo $nextId . ".<br/>";
				//echo "  ##  $nextId  ### $prevId<br/>";

				$nextSpelling = $nextResult['spelling'];
				$nextSpellingLower = mb_strtolower($nextSpelling);

				similar_text($searchWordLower,$nextSpellingLower,$similarity);

				if ($similarity > $highestSimilarity) {
					$rowIndex = $resultI;
					$highestSimilarity = $similarity;
					$rowToMove = $nextResult;
				}

				$prevId = $nextId;
			}


			$spliceCount = 1;

			if ($rowToMove['type'] === "verb") {
				$partnerIDs = $rowToMove['v_partner_id'];
				$partners = $rowToMove['v_partner_spelling'];
				$stressPoses = $rowToMove['v_partner_stress_pos'];
				$aspects = $rowToMove['v_partner_aspect'];

				$rowToMoveId = $rowToMove['id'];

				$subseqRowIndex = $rowIndex+1;

				while ($subseqRowIndex < $resultsArrayCount && $resultsArray[$subseqRowIndex]['id'] === $rowToMoveId) {
					$partnerIDs .= "|" . $resultsArray[$subseqRowIndex]['v_partner_id'];
					$partners .= "|" . $resultsArray[$subseqRowIndex]['v_partner_spelling'];
					$stressPoses .= "|" . $resultsArray[$subseqRowIndex]['v_partner_stress_pos'];
					$aspects .= "|" . $resultsArray[$subseqRowIndex]['v_partner_aspect'];

					$spliceCount++;
					$subseqRowIndex++;
				}


				$rowToMove['v_partner_id'] = $partnerIDs;
				$rowToMove['v_partner_spelling'] = $partners;
				$rowToMove['v_partner_stress_pos'] = $stressPoses;
				$rowToMove['v_partner_aspect'] = $aspects;
			}

			array_splice($resultsArray, $rowIndex, $spliceCount);
			array_push($resultsArraySorted, $rowToMove);

			$beforeJson = (object)['data' => $resultsArraySorted];

			$resultsArrayCount--;
		}

		return json_encode($beforeJson, JSON_UNESCAPED_UNICODE);
	}

	public function searchByEnglishWords($con, $searchWords) {

		$searchWords = preg_replace("/[^A-Za-z0-9 ]/", '', $searchWords);
		$searchWordLower = mb_strtolower($searchWords);

		$allWords = explode(' ', $searchWordLower);

		$whereClause = "WHERE (`b`.`dec_class`=\"infinitive\" OR `b`.`dec_class`=\"dec_nom_m\" OR (`b`.`dec_class`=\"dec_s_n\" AND `n`.`dec_type`!=\"p\") OR (`b`.`dec_class`=\"dec_p_n\" AND `n`.`dec_type`=\"p\")) AND (";

		$allWordsLen = count($allWords);

		for ($i=0; $i<$allWordsLen; $i++) {
			if ($i==0) {
				$whereClause .= " `ew`.`english_search_word`=\"" . $allWords[$i] . "\"";
			}
			else {
				$whereClause .= " OR `ew`.`english_search_word`=\"" . $allWords[$i] . "\"";
			}
		}

		$whereClause .= ")";

		$con->select_db ($this->db);

		$q = "SELECT `b`.`id` `id`, `b`.`dec_class`, `b`.`spelling` `spelling`, `b`.`stress_pos` `stress_pos`,"
		." `b`.`word_id`, `b`.`spelling` `dict_form_spelling`, `b`.`stress_pos` `dict_form_stress_pos`,"
		." `w`.`type`, `i`.`english_words` `english_words`, `v`.`verb_partner_id` `v_partner_id`, `vp`.`spelling` `v_partner_spelling`, `vp`.`stress_pos` `v_partner_stress_pos`,"
		." `vi`.`aspect` `aspect`, `vip`.`aspect` `v_partner_aspect`"
		." FROM `EnglishWords` `ew`"
		." JOIN `WordForms` `b` ON `ew`.`word_id` = `b`.`word_id`"
		." LEFT JOIN `NounsInfo` `n` ON `b`.`word_id`=`n`.`id`"
		." LEFT JOIN `VerbPartners` `v` ON `b`.`word_id`=`v`.`verb_id`"
		." LEFT JOIN `WordForms` `vp` ON `v`.`verb_partner_id`=`vp`.`word_id` AND `vp`.`dec_class`=\"infinitive\""
		." JOIN `Words` `w` ON `w`.`id` = `b`.`word_id`"
		." LEFT JOIN `VerbsInfo` `vi` ON `b`.`word_id`=`vi`.`id`"
		." LEFT JOIN `VerbsInfo` `vip` ON `v`.`verb_partner_id`=`vip`.`id`"
		." JOIN `Information` `i` ON `b`.`word_id` = `i`.`id`"
		." $whereClause";

		//echo $q;
		//exit;

		$result = $con->query($q);

		$resultsArray = array();

		while ($row = mysqli_fetch_assoc($result)) {
			array_push($resultsArray, $row);
		}

		$resultsArraySorted = array();

		$beforeJson;


		for ($i=0; $i<20; $i++) {

			$rowToMove = null;
			$highestSimilarity = -1;
			$rowIndex = -1;

			$resultsArrayCount = count($resultsArray);
			if ($resultsArrayCount == 0) break;

			$prevId = null;
			$prevRow = null;

			for ($resultI=0; $resultI < $resultsArrayCount; $resultI++) {

				$nextResult = $resultsArray[$resultI];

				if ($nextResult === null) {
					$prevId = null;
					continue;
				}

				$nextId = $nextResult['id'];

				$nextSpelling = $nextResult['spelling'];
				$nextSpellingLower = mb_strtolower($nextSpelling);

				similar_text($searchWordLower,$nextSpellingLower,$similarity);

				if ($similarity > $highestSimilarity) {
					$rowIndex = $resultI;
					$highestSimilarity = $similarity;
					$rowToMove = $nextResult;
				}

				$prevId = $nextId;
			}


			$spliceCount = 1;

			if ($rowToMove['type'] === "verb") {
				$partnerIDs = $rowToMove['v_partner_id'];
				$partners = $rowToMove['v_partner_spelling'];
				$stressPoses = $rowToMove['v_partner_stress_pos'];
				$aspects = $rowToMove['v_partner_aspect'];

				$rowToMoveId = $rowToMove['id'];

				$subseqRowIndex = $rowIndex+1;

				while ($subseqRowIndex < $resultsArrayCount && $resultsArray[$subseqRowIndex]['id'] === $rowToMoveId) {
					$partnerIDs .= "|" . $resultsArray[$subseqRowIndex]['v_partner_id'];
					$partners .= "|" . $resultsArray[$subseqRowIndex]['v_partner_spelling'];
					$stressPoses .= "|" . $resultsArray[$subseqRowIndex]['v_partner_stress_pos'];
					$aspects .= "|" . $resultsArray[$subseqRowIndex]['v_partner_aspect'];

					$spliceCount++;
					$subseqRowIndex++;
				}


				$rowToMove['v_partner_id'] = $partnerIDs;
				$rowToMove['v_partner_spelling'] = $partners;
				$rowToMove['v_partner_stress_pos'] = $stressPoses;
				$rowToMove['v_partner_aspect'] = $aspects;
			}

			array_splice($resultsArray, $rowIndex, $spliceCount);
			array_push($resultsArraySorted, $rowToMove);

			$beforeJson = (object)['data' => $resultsArraySorted, 'searchbyenglishwords' => $allWords];

			$resultsArrayCount--;
		}

		return json_encode($beforeJson, JSON_UNESCAPED_UNICODE);
	}


	public function compareWordSimilarities($w1, $w2) {
		similar_text($w1,$w2,$similarity);
		return $similarity;
	}

    
}